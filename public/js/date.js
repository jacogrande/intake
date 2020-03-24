const getWeeks = (startDate, endDate, dates) => {
  // set designated time period
  const firstDate = new Date(startDate);
  const lastDate = new Date(endDate);
  const today = lastDate.getDate();
  const weeks = [];

  // define the first week as the first date until the next monday
  let start = new Date(firstDate);
  let end = new Date(firstDate);
  const timeUntilMonday = (start.getDay() % 7);
  if (timeUntilMonday > 1) {
    end.setDate(end.getDate() + timeUntilMonday);
  } else {
    end.setDate(end.getDate() + 7);
  }

  weeks.push({ start, end, entries: 0 });
  // add weeks starting from the closest monday until
  // loop until the current week matches the end date

  while (end < lastDate) {
    start = new Date(end);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
    weeks.push({ start, end, entries: 0 });
  }

  dates.forEach((date) => {
    const newDate = new Date(date);
    for (let i = 0; i < weeks.length; i++) {
      if (newDate >= weeks[i].start && newDate <= weeks[i].end) {
        weeks[i].entries++;
        break;
      }
    }
  });

  return weeks;
};
