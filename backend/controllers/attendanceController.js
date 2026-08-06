const Attendance = require('../models/Attendance');
const User = require('../models/User');

const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = new Date(now.getTime() - offset).toISOString().split('T')[0];
  return localISOTime;
};

const isLateCheckIn = (dateStr, checkInDate) => {
  const checkInTime = new Date(checkInDate);
  const cutoff = new Date(`${dateStr}T10:15:00`);
  return checkInTime > cutoff;
};

const isEarlyCheckOut = (dateStr, checkOutDate) => {
  const checkOutTime = new Date(checkOutDate);
  const cutoff = new Date(`${dateStr}T20:45:00`);
  return checkOutTime < cutoff;
};

const autoMarkAbsentAndLate = async (dateStr) => {
  const now = new Date();
  const cutoff = new Date(`${dateStr}T10:15:00`);
  if (now > cutoff) {
    const employees = await User.find();
    for (const emp of employees) {
      const existing = await Attendance.findOne({ employeeId: emp._id, date: dateStr });
      if (!existing) {
        await Attendance.create({
          employeeId: emp._id,
          date: dateStr,
          status: 'Absent'
        });
      }
    }
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const dateStr = getLocalDateString();
    await autoMarkAbsentAndLate(dateStr);
    
    let attendance = await Attendance.findOne({ employeeId: req.user._id, date: dateStr });
    
    if (!attendance) {
      attendance = { status: 'Not Checked In' };
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const dateStr = getLocalDateString();
    const now = new Date();
    
    let attendance = await Attendance.findOne({ employeeId: req.user._id, date: dateStr });
    
    if (!attendance || attendance.status === 'Absent') {
      const isLate = isLateCheckIn(dateStr, now);
      
      const updateData = {
        employeeId: req.user._id,
        date: dateStr,
        checkIn: now,
        status: isLate ? 'Late' : 'Working',
        isLate
      };

      if (attendance) {
        Object.assign(attendance, updateData);
        await attendance.save();
      } else {
        attendance = await Attendance.create(updateData);
      }
      
      return res.status(201).json(attendance);
    } else if (attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startLunch = async (req, res) => {
  try {
    const dateStr = getLocalDateString();
    let attendance = await Attendance.findOne({ employeeId: req.user._id, date: dateStr });
    
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'Must check in before starting lunch' });
    }
    if (attendance.lunchStart) {
      return res.status(400).json({ message: 'Lunch already started' });
    }
    
    attendance.lunchStart = new Date();
    attendance.status = 'Lunch Break';
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.endLunch = async (req, res) => {
  try {
    const dateStr = getLocalDateString();
    let attendance = await Attendance.findOne({ employeeId: req.user._id, date: dateStr });
    
    if (!attendance || !attendance.lunchStart) {
      return res.status(400).json({ message: 'Must start lunch before ending lunch' });
    }
    if (attendance.lunchEnd) {
      return res.status(400).json({ message: 'Lunch already ended' });
    }
    
    const now = new Date();
    attendance.lunchEnd = now;
    const lunchDurationMs = now.getTime() - new Date(attendance.lunchStart).getTime();
    attendance.lunchDuration = Math.round(lunchDurationMs / 60000);
    attendance.status = 'Working After Lunch';
    
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const dateStr = getLocalDateString();
    let attendance = await Attendance.findOne({ employeeId: req.user._id, date: dateStr });
    
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'Must check in before checking out' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out' });
    }
    if (attendance.lunchStart && !attendance.lunchEnd) {
      return res.status(400).json({ message: 'Must end lunch before checking out' });
    }
    
    const now = new Date();
    attendance.checkOut = now;
    
    const isEarly = isEarlyCheckOut(dateStr, now);
    attendance.isEarlyExit = isEarly;
    
    const workingMs = now.getTime() - new Date(attendance.checkIn).getTime() - (attendance.lunchDuration * 60000);
    attendance.workingMinutes = Math.round(workingMs / 60000);
    
    attendance.status = isEarly ? 'Early Exit' : 'Completed';
    
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    let { date } = req.query;
    if (!date) {
      date = getLocalDateString();
    }
    
    if (date === getLocalDateString()) {
      await autoMarkAbsentAndLate(date);
    }
    
    const attendances = await Attendance.find({ date }).populate('employeeId', 'name');
    const employees = await User.find().select('name');
    
    // Ensure every employee has an entry in response, even if missing in db for past dates
    const data = employees.map(emp => {
      const att = attendances.find(a => a.employeeId && a.employeeId._id.toString() === emp._id.toString());
      
      let currentWorkingMinutes = 0;
      if (att && att.checkIn) {
        if (att.checkOut) {
          currentWorkingMinutes = att.workingMinutes || 0;
        } else {
          const now = new Date();
          let workingMs = now.getTime() - new Date(att.checkIn).getTime();
          
          if (att.lunchDuration) {
            workingMs -= (att.lunchDuration * 60000);
          } else if (att.lunchStart && !att.lunchEnd) {
            workingMs -= (now.getTime() - new Date(att.lunchStart).getTime());
          }
          
          currentWorkingMinutes = Math.max(0, Math.round(workingMs / 60000));
        }
      }

      return {
        _id: att ? att._id : null,
        employeeId: emp,
        checkIn: att ? att.checkIn : null,
        lunchStart: att ? att.lunchStart : null,
        lunchEnd: att ? att.lunchEnd : null,
        lunchDuration: att ? (att.lunchDuration || 0) : 0,
        checkOut: att ? att.checkOut : null,
        status: att ? att.status : 'Not Checked In',
        workingMinutes: currentWorkingMinutes,
        isLate: att ? att.isLate : false,
        isEarlyExit: att ? att.isEarlyExit : false
      };
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
