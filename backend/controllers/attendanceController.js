const Attendance = require('../models/Attendance');
const User = require('../models/User');
const SalarySetting = require('../models/SalarySetting');
const Holiday = require('../models/Holiday');

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
  
  // Check if today is a company holiday
  const holiday = await Holiday.findOne({ date: dateStr });
  if (holiday) {
    const employees = await User.find();
    for (const emp of employees) {
      const existing = await Attendance.findOne({ employeeId: emp._id, date: dateStr });
      if (!existing) {
        await Attendance.create({
          employeeId: emp._id,
          date: dateStr,
          status: 'Holiday'
        });
      } else if (existing.status === 'Absent' || existing.status === 'Not Checked In') {
        existing.status = 'Holiday';
        await existing.save();
      }
    }
    return;
  }

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
    const salarySetting = await SalarySetting.findOne({ employeeId: req.user._id });
    const hoursPerDay = salarySetting?.hoursPerDay || 8;
    const holiday = await Holiday.findOne({ date: dateStr });
    
    if (!attendance) {
      if (holiday) {
        return res.json({ status: 'Holiday', holidayTitle: holiday.title, date: dateStr, hoursPerDay, targetWorkingMinutes: hoursPerDay * 60 });
      }
      return res.json({ status: 'Not Checked In', hoursPerDay, targetWorkingMinutes: hoursPerDay * 60 });
    }
    
    const attObj = attendance.toObject();
    attObj.hoursPerDay = hoursPerDay;
    attObj.targetWorkingMinutes = hoursPerDay * 60;
    if (holiday) {
      attObj.holidayTitle = holiday.title;
      if (!attendance.checkIn && attendance.status !== 'Working') {
        attObj.status = 'Holiday';
      }
    }
    
    res.json(attObj);
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
    
    if (attendance.status === 'Paused') {
      const activePause = attendance.pauses[attendance.pauses.length - 1];
      if (activePause && !activePause.end) {
        activePause.end = now;
        const pDuration = Math.round((now.getTime() - new Date(activePause.start).getTime()) / 60000);
        attendance.pauseDuration += pDuration;
      }
    }
    
    attendance.checkOut = now;
    
    const workingMs = now.getTime() - new Date(attendance.checkIn).getTime() - (attendance.lunchDuration * 60000) - ((attendance.pauseDuration || 0) * 60000);
    attendance.workingMinutes = Math.round(workingMs / 60000);
    
    const salarySetting = await SalarySetting.findOne({ employeeId: req.user._id });
    const hoursPerDay = salarySetting?.hoursPerDay || 8;
    const targetWorkingMinutes = hoursPerDay * 60;
    
    const isEarly = attendance.workingMinutes < targetWorkingMinutes;
    attendance.isEarlyExit = isEarly;
    attendance.status = isEarly ? 'Early Exit' : 'Completed';
    
    await attendance.save();
    
    const attObj = attendance.toObject();
    attObj.hoursPerDay = hoursPerDay;
    attObj.targetWorkingMinutes = targetWorkingMinutes;
    
    res.json(attObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.pauseTracking = async (req, res) => {
  try {
    const dateStr = getLocalDateString();
    let attendance = await Attendance.findOne({ employeeId: req.user._id, date: dateStr });
    
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'Must check in before pausing' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out' });
    }
    if (attendance.lunchStart && !attendance.lunchEnd) {
      return res.status(400).json({ message: 'Cannot pause during lunch' });
    }
    if (attendance.status === 'Paused') {
      return res.status(400).json({ message: 'Already paused' });
    }
    
    attendance.pauses.push({ start: new Date() });
    attendance.status = 'Paused';
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resumeTracking = async (req, res) => {
  try {
    const dateStr = getLocalDateString();
    let attendance = await Attendance.findOne({ employeeId: req.user._id, date: dateStr });
    
    if (!attendance || attendance.status !== 'Paused') {
      return res.status(400).json({ message: 'Not currently paused' });
    }
    
    const activePause = attendance.pauses[attendance.pauses.length - 1];
    if (activePause && !activePause.end) {
      const now = new Date();
      activePause.end = now;
      const durationMs = now.getTime() - new Date(activePause.start).getTime();
      attendance.pauseDuration += Math.round(durationMs / 60000);
    }
    
    attendance.status = attendance.lunchEnd ? 'Working After Lunch' : 'Working';
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
    
    await autoMarkAbsentAndLate(date);
    
    const attendances = await Attendance.find({ date }).populate('employeeId', 'name');
    const employees = await User.find().select('name');
    const salarySettings = await SalarySetting.find();
    const holiday = await Holiday.findOne({ date });
    
    // Ensure every employee has an entry in response, even if missing in db for past dates
    const data = employees.map(emp => {
      const att = attendances.find(a => a.employeeId && a.employeeId._id.toString() === emp._id.toString());
      const setting = salarySettings.find(s => s.employeeId.toString() === emp._id.toString());
      const hoursPerDay = setting?.hoursPerDay || 8;
      
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
          
          if (att.pauseDuration) {
            workingMs -= (att.pauseDuration * 60000);
          }
          
          if (att.status === 'Paused' && att.pauses && att.pauses.length > 0) {
            const activePause = att.pauses[att.pauses.length - 1];
            if (activePause && !activePause.end) {
              workingMs -= (now.getTime() - new Date(activePause.start).getTime());
            }
          }
          
          currentWorkingMinutes = Math.max(0, Math.round(workingMs / 60000));
        }
      }

      let defaultStatus = 'Not Checked In';
      if (holiday && (!att || !att.checkIn)) {
        defaultStatus = 'Holiday';
      }

      return {
        _id: att ? att._id : null,
        employeeId: emp,
        checkIn: att ? att.checkIn : null,
        lunchStart: att ? att.lunchStart : null,
        lunchEnd: att ? att.lunchEnd : null,
        lunchDuration: att ? (att.lunchDuration || 0) : 0,
        checkOut: att ? att.checkOut : null,
        status: att ? (holiday && !att.checkIn ? 'Holiday' : att.status) : defaultStatus,
        workingMinutes: currentWorkingMinutes,
        isLate: att ? att.isLate : false,
        isEarlyExit: att ? att.isEarlyExit : false,
        hoursPerDay: hoursPerDay,
        targetWorkingMinutes: hoursPerDay * 60,
        holidayTitle: holiday ? holiday.title : null
      };
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMonthlyAttendance = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const paddedMonth = month.toString().padStart(2, '0');
    const regexPattern = new RegExp(`^${year}-${paddedMonth}`);

    const attendances = await Attendance.find({
      employeeId,
      date: { $regex: regexPattern }
    }).sort({ date: 1 }).populate('employeeId', 'name');

    const holidays = await Holiday.find({
      date: { $regex: regexPattern }
    });

    const salarySetting = await SalarySetting.findOne({ employeeId });
    const hoursPerDay = salarySetting?.hoursPerDay || 8;

    const data = attendances.map(att => {
      const attObj = att.toObject();
      const hol = holidays.find(h => h.date === att.date);
      if (hol && !attObj.checkIn) {
        attObj.status = 'Holiday';
        attObj.holidayTitle = hol.title;
      }
      attObj.hoursPerDay = hoursPerDay;
      attObj.targetWorkingMinutes = hoursPerDay * 60;
      return attObj;
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const User = require('../models/User');
    const Attendance = require('../models/Attendance');

    const paddedMonth = month.toString().padStart(2, '0');
    const regexPattern = new RegExp(`^${year}-${paddedMonth}`);

    // Get all employees
    const employees = await User.find({ role: 'Employee' }).select('_id name');
    
    // Get all attendances for the month
    const allAttendances = await Attendance.find({
      date: { $regex: regexPattern }
    });

    const holidays = await Holiday.find({
      date: { $regex: regexPattern }
    });

    const result = employees.map(emp => {
      const empAttendances = allAttendances.filter(a => a.employeeId.toString() === emp._id.toString());
      
      let totalWorkingMs = 0;
      let daysPresent = 0;
      let daysAbsent = 0;
      let daysLate = 0;
      let daysHoliday = 0;

      empAttendances.forEach(att => {
        const isHol = holidays.some(h => h.date === att.date);
        if (att.status === 'Holiday' || (isHol && !att.checkIn)) {
          daysHoliday++;
        } else {
          if (['Working', 'Working After Lunch', 'Completed', 'Late', 'Early Exit', 'Checked Out'].includes(att.status) || att.checkIn) {
            daysPresent++;
          }
          if (att.status === 'Absent') {
            daysAbsent++;
          }
          if (att.status === 'Late') {
            daysLate++;
          }
        }
        if (att.workingMs) {
          totalWorkingMs += att.workingMs;
        }
      });

      return {
        employee: emp,
        daysPresent,
        daysAbsent,
        daysLate,
        daysHoliday,
        totalWorkingMs,
        attendancesCount: empAttendances.length
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getAllMonthlyAttendance:', error);
    res.status(500).json({ message: 'Server error fetching overall monthly attendance' });
  }
};

exports.adminUpdateAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, lunchStart, lunchEnd, checkOut } = req.body;
    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Employee ID and date are required' });
    }

    let attendance = await Attendance.findOne({ employeeId, date });
    
    if (!attendance) {
      attendance = new Attendance({ employeeId, date });
    }

    if (checkIn) attendance.checkIn = new Date(checkIn);
    else attendance.checkIn = null;

    if (lunchStart) attendance.lunchStart = new Date(lunchStart);
    else attendance.lunchStart = null;

    if (lunchEnd) attendance.lunchEnd = new Date(lunchEnd);
    else attendance.lunchEnd = null;

    if (checkOut) attendance.checkOut = new Date(checkOut);
    else attendance.checkOut = null;

    // Recalculate durations
    if (attendance.lunchStart && attendance.lunchEnd) {
      const lunchMs = attendance.lunchEnd.getTime() - attendance.lunchStart.getTime();
      attendance.lunchDuration = Math.max(0, Math.round(lunchMs / 60000));
    } else {
      attendance.lunchDuration = 0;
    }

    if (attendance.checkIn && attendance.checkOut) {
      let workingMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
      workingMs -= (attendance.lunchDuration * 60000);
      workingMs -= ((attendance.pauseDuration || 0) * 60000);
      attendance.workingMinutes = Math.max(0, Math.round(workingMs / 60000));
      attendance.status = 'Completed';
    } else if (attendance.checkIn) {
      attendance.workingMinutes = 0;
      if (attendance.lunchStart && !attendance.lunchEnd) {
        attendance.status = 'Lunch Break';
      } else if (attendance.lunchEnd) {
        attendance.status = 'Working After Lunch';
      } else {
        attendance.status = 'Working';
      }
    } else {
      attendance.workingMinutes = 0;
      const holiday = await Holiday.findOne({ date });
      attendance.status = holiday ? 'Holiday' : 'Absent';
    }

    // Determine late check-in
    if (attendance.checkIn) {
      const cutoff = new Date(`${date}T10:15:00`);
      attendance.isLate = attendance.checkIn > cutoff;
    } else {
      attendance.isLate = false;
    }

    const salarySetting = await SalarySetting.findOne({ employeeId });
    const hoursPerDay = salarySetting?.hoursPerDay || 8;
    const targetWorkingMinutes = hoursPerDay * 60;

    // Determine early checkout
    if (attendance.checkOut) {
      attendance.isEarlyExit = attendance.workingMinutes < targetWorkingMinutes;
      if (attendance.isEarlyExit && attendance.status === 'Completed') {
        attendance.status = 'Early Exit';
      }
    } else {
      attendance.isEarlyExit = false;
    }

    await attendance.save();
    
    const attObj = attendance.toObject();
    attObj.hoursPerDay = hoursPerDay;
    attObj.targetWorkingMinutes = targetWorkingMinutes;

    res.json(attObj);

  } catch (error) {
    console.error('Error in adminUpdateAttendance:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    if (month && year) {
      const paddedMonth = month.toString().padStart(2, '0');
      query.date = { $regex: new RegExp(`^${year}-${paddedMonth}`) };
    } else if (year) {
      query.date = { $regex: new RegExp(`^${year}-`) };
    }
    const holidays = await Holiday.find(query).sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addHoliday = async (req, res) => {
  try {
    const { date, title, description } = req.body;
    if (!date) {
      return res.status(400).json({ message: 'Date is required for holiday' });
    }

    let holiday = await Holiday.findOne({ date });
    if (holiday) {
      holiday.title = title || holiday.title;
      holiday.description = description || holiday.description;
      await holiday.save();
    } else {
      holiday = await Holiday.create({
        date,
        title: title || 'Company Holiday',
        description: description || ''
      });
    }

    // Update all employees' attendance for that date to 'Holiday' if not already checked in
    const employees = await User.find();
    for (const emp of employees) {
      let att = await Attendance.findOne({ employeeId: emp._id, date });
      if (!att) {
        await Attendance.create({
          employeeId: emp._id,
          date,
          status: 'Holiday'
        });
      } else if (!att.checkIn || att.status === 'Absent' || att.status === 'Not Checked In') {
        att.status = 'Holiday';
        await att.save();
      }
    }

    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    const holidayDate = holiday.date;
    await Holiday.findByIdAndDelete(id);

    // Reset holiday attendances for that date back to Not Checked In
    await Attendance.updateMany(
      { date: holidayDate, status: 'Holiday' },
      { $set: { status: 'Not Checked In' } }
    );

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
