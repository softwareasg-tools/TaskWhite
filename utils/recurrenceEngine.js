/**
 * Utility to calculate the next occurrence date of a recurring task.
 * Purely operates on date-only fields without timezone shifts.
 */

function parseDateOnly(dateStr) {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

function formatDateOnly(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDayOfWeekInMonth(year, month, week, dayOfWeekStr) {
  const dayMap = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
  const targetDayOfWeek = dayMap[dayOfWeekStr];
  
  if (week === 'last') {
    const lastDay = new Date(year, month + 1, 0);
    while (lastDay.getDay() !== targetDayOfWeek) {
      lastDay.setDate(lastDay.getDate() - 1);
    }
    return lastDay;
  } else {
    const firstDay = new Date(year, month, 1);
    while (firstDay.getDay() !== targetDayOfWeek) {
      firstDay.setDate(firstDay.getDate() + 1);
    }
    
    let offset = 0;
    if (week === 'second') offset = 7;
    if (week === 'third') offset = 14;
    if (week === 'fourth') offset = 21;
    
    firstDay.setDate(firstDay.getDate() + offset);
    return firstDay;
  }
}

function getNextOccurrence(currentDateStr, rule) {
  const current = parseDateOnly(currentDateStr);
  let next = new Date(current);
  
  const frequency = rule.frequency; // 'daily', 'weekly', 'monthly', 'yearly'
  const interval = parseInt(rule.interval || 1, 10);
  
  if (frequency === 'daily') {
    next.setDate(next.getDate() + interval);
  } else if (frequency === 'weekly') {
    const weeklyDays = rule.weeklyDays || [];
    const dayMap = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
    
    if (weeklyDays.length === 0) {
      next.setDate(next.getDate() + (7 * interval));
    } else {
      const targetDays = weeklyDays.map(d => dayMap[d]).sort((a, b) => a - b);
      const currentDayOfWeek = current.getDay();
      
      let found = false;
      for (let day of targetDays) {
        if (day > currentDayOfWeek) {
          const diff = day - currentDayOfWeek;
          next.setDate(next.getDate() + diff);
          found = true;
          break;
        }
      }
      
      if (!found) {
        const firstTarget = targetDays[0];
        const diff = (7 - currentDayOfWeek) + firstTarget + (7 * (interval - 1));
        next.setDate(next.getDate() + diff);
      }
    }
  } else if (frequency === 'monthly') {
    if (rule.monthlyType === 'dayOfWeek') {
      next.setMonth(next.getMonth() + interval);
      next = getDayOfWeekInMonth(next.getFullYear(), next.getMonth(), rule.monthlyWeek, rule.monthlyDayOfWeek);
    } else {
      const targetDay = parseInt(rule.monthlyDay || current.getDate(), 10);
      next.setMonth(next.getMonth() + interval);
      const lastDayOfTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(targetDay, lastDayOfTargetMonth));
    }
  } else if (frequency === 'yearly') {
    next.setFullYear(next.getFullYear() + interval);
  }
  
  return formatDateOnly(next);
}

module.exports = {
  getNextOccurrence,
  parseDateOnly,
  formatDateOnly
};
