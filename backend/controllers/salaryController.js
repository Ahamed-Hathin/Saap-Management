const SalarySetting = require('../models/SalarySetting');
const Attendance = require('../models/Attendance');

// Get setting for employee
const getSalarySetting = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let setting = await SalarySetting.findOne({ employeeId });
    if (!setting) {
      setting = { salaryPerDay: 0, hoursPerDay: 8, workingDaysPerMonth: 26 };
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update setting
const updateSalarySetting = async (req, res) => {
  try {
    const { employeeId, salaryPerDay, hoursPerDay, workingDaysPerMonth } = req.body;
    let setting = await SalarySetting.findOne({ employeeId });
    if (setting) {
      setting.salaryPerDay = salaryPerDay;
      setting.hoursPerDay = hoursPerDay;
      setting.workingDaysPerMonth = workingDaysPerMonth;
      await setting.save();
    } else {
      setting = new SalarySetting({
        employeeId,
        salaryPerDay,
        hoursPerDay,
        workingDaysPerMonth
      });
      await setting.save();
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate salary for a given month
const calculateSalary = async (req, res) => {
  try {
    const { employeeId, month } = req.params; // month format: 'YYYY-MM'
    
    const setting = await SalarySetting.findOne({ employeeId });
    if (!setting) {
      return res.status(404).json({ message: 'Salary settings not configured for this employee.' });
    }

    // Fetch attendance for the month
    const regexPattern = new RegExp(`^${month}`);
    const attendances = await Attendance.find({
      employeeId,
      date: { $regex: regexPattern }
    });

    let totalWorkingMinutes = 0;
    attendances.forEach(att => {
      totalWorkingMinutes += (att.workingMinutes || 0);
    });

    const actualWorkedHours = totalWorkingMinutes / 60;
    const expectedHours = setting.workingDaysPerMonth * setting.hoursPerDay;
    const baseSalary = setting.workingDaysPerMonth * setting.salaryPerDay;
    
    // Hourly rate
    const hourlyRate = setting.salaryPerDay / setting.hoursPerDay;

    // Difference in hours
    const differenceInHours = actualWorkedHours - expectedHours;
    
    // Calculated bonus / deduction
    const salaryAdjustment = differenceInHours * hourlyRate;
    
    // Final salary
    const finalSalary = baseSalary + salaryAdjustment;

    res.json({
      setting,
      actualWorkedHours,
      expectedHours,
      baseSalary,
      hourlyRate,
      differenceInHours,
      salaryAdjustment,
      finalSalary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSalarySetting,
  updateSalarySetting,
  calculateSalary
};
