const fs = require('fs');
const path = require('path');

const addGetAllMonthlyAttendance = () => {
  const filePath = path.join(__dirname, '..', 'backend/controllers/attendanceController.js');
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('getAllMonthlyAttendance')) {
    console.log('Already exists');
    return;
  }

  const func = `
exports.getAllMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const User = require('../models/User');
    const Attendance = require('../models/Attendance');

    const paddedMonth = month.toString().padStart(2, '0');
    const regexPattern = new RegExp(\`^\${year}-\${paddedMonth}\`);

    // Get all employees
    const employees = await User.find({ role: 'Employee' }).select('_id name');
    
    // Get all attendances for the month
    const allAttendances = await Attendance.find({
      date: { $regex: regexPattern }
    });

    const result = employees.map(emp => {
      const empAttendances = allAttendances.filter(a => a.employeeId.toString() === emp._id.toString());
      
      let totalWorkingMs = 0;
      let daysPresent = 0;
      let daysAbsent = 0;
      let daysLate = 0;

      empAttendances.forEach(att => {
        if (['Working', 'Working After Lunch', 'Completed', 'Late', 'Checked Out'].includes(att.status) || att.checkIn) {
          daysPresent++;
        }
        if (att.status === 'Absent') {
          daysAbsent++;
        }
        if (att.status === 'Late') {
          daysLate++;
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
`;

  content += func;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Added getAllMonthlyAttendance');
};

addGetAllMonthlyAttendance();
