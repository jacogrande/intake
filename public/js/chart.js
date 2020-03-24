// modify Date prototype to format date strings
Date.prototype.formatString = function (fullDate) {
  const month = this.getMonth() + 1; // stored from 0 to 11
  const date = this.getDate();
  const year = this.getFullYear().toString().substring(2, 4);
  return fullDate ? `${month}/${date}/${year}` : `${month}/${date}`;
};

// color palettes
const greenColors = ['#4ed4a1', '#69cba6', '#7abfa5', '#9acdba', '#b4d6c9', '#cbe7dc'];
const purpleColors = ['#EF4AB5', '#f17cc7', '#f2a1d5', '#f0bfde'];
const blueColors = ['#1E262A', '#2f3b41', '#3d4b52', '#495860', '#586a73', '#677d87', '#79919c', '#8ba1ab', '#9fb2ba', '#a9c1cb'];
const allColors = [greenColors, purpleColors, blueColors];

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
const drawChart = (rawData, id) => {
  // Create the data table.
  data = new google.visualization.DataTable();
  data.addColumn('string', 'label');
  data.addColumn('number', 'value');
  data.addRows(rawData);

  // Set chart options
  const options = {
    title: '',
    width: '100%',
    height: 225,
    backgroundColor: { fill: 'transparent' },
    colors: allColors[Math.floor(Math.random() * allColors.length)],
    legend: {
      position: 'top', textStyle: { color: '#D5D5D5', fontSize: 16 }, alignment: 'center', maxLines: 3,
    },
    animation: { duration: 1000, startup: true },
  };

  // Instantiate and draw our chart, passing in some options.
  const chart = new google.visualization.PieChart(document.getElementById(id));
  chart.draw(data, options);
};

// function for drawing the viewing timeline bar graph
const drawViewingTimeline = (rawData, id) => {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Date');
  data.addColumn('number', 'Movies Viewed');
  data.addColumn({ type: 'string', role: 'style' });
  data.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
  console.log(rawData);

  const rows = [];
  let dateString = '';
  let tooltipString = '';
  for (let i = 0; i < rawData.length; i++) {
    dateString = rawData[i].start.formatString();
    tooltipString = `<span class = 'black'> <strong> Week of ${dateString} </strong><br> Movies Viewed: ${rawData[i].entries}</span>`;
    if (i % 4 === 0 || i === rawData.length - 1) {
      if (rawData[i].entries > 0) {
        rows.push([dateString, rawData[i].entries, 'color:#ec8ac9', tooltipString]);
      } else {
        rows.push([dateString, rawData[i].entries, 'color:#8EC3AF', tooltipString]);
      }
    } else if (rawData[i].entries > 0) {
      rows.push(['', rawData[i].entries, 'color:#ec8ac9', tooltipString]);
    } else {
      rows.push(['', rawData[i].entries, 'color: #8EC3AF', tooltipString]);
    }
  }


  data.addRows(rows);

  // set chart options
  const options = {
    title: '',
    height: 400,
    width: '100%',
    hAxis: {
      title: 'Weeks', titleTextStyle: { color: '#D5D5D5', fontSize: 16 }, textStyle: { color: '#D5D5D5' }, gridlines: { minSpacing: 80 },
    },
    vAxis: {
      title: 'Movies', titleTextStyle: { color: '#D5D5D5', fontSize: 16 }, minValue: 0, textStyle: { color: '#D5D5D5', fontSize: 16 }, gridlines: { color: '#192024' }, minorGridlines: { color: '#1E262A' }, format: '0',
    },
    legend: { position: 'none' },
    backgroundColor: { fill: 'transparent', stroke: 'transparent' },
    colors: ['#ec8ac9'],
    tooltip: { isHtml: true },
  };

  const chart = new google.visualization.ColumnChart(document.getElementById(id));
  chart.draw(data, options);
};

// function for drawing release timeline
const drawReleaseTimeline = (decades, id) => {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Date');
  data.addColumn('number', 'Movies Viewed');
  data.addColumn({ type: 'string', role: 'style' });
  data.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });

  const rows = [];
  // for (let i = 0; i < decades.length; i++) {
  //
  // }
  decades.forEach((decade) => {
    if (decade.entries > 0) {
      rows.push([`${decade.decade.toString()}s`, decade.entries, 'color:#8EC3AF', `<span class = 'black'> <strong>${decade.decade} </strong><br> Movies Released: ${decade.entries}</span>`]);
    } else {
      rows.push([`${decade.decade.toString()}s`, decade.entries, 'color:#ec8ac9', `<span class = 'black'> <strong>${decade.decade} </strong><br> Movies Released: ${decade.entries}</span>`]);
    }
  });

  data.addRows(rows);

  // set chart options
  const options = {
    title: '',
    height: 400,
    width: '100%',
    hAxis: {
      title: 'Decades', titleTextStyle: { color: '#D5D5D5', fontSize: 16 }, textStyle: { color: '#D5D5D5' }, gridlines: { minSpacing: 80 },
    },
    vAxis: {
      title: 'Movies', titleTextStyle: { color: '#D5D5D5', fontSize: 16 }, minValue: 0, textStyle: { color: '#D5D5D5', fontSize: 16 }, gridlines: { color: '#192024' }, minorGridlines: { color: '#1E262A' }, format: '0',
    },
    legend: { position: 'none' },
    backgroundColor: { fill: 'transparent', stroke: 'transparent' },
    colors: ['#8EC3AF'],
    animation: { duration: 1500, startup: true },
    tooltip: { isHtml: true },
  };

  const chart = new google.visualization.ColumnChart(document.getElementById(id));
  chart.draw(data, options);
};

const renderCharts = async (data) => {
  await google.charts.load('current', { packages: ['corechart', 'bar'] });
  drawChart(data.ratings, 'rating_chart');
  drawChart(data.themeList, 'themes_chart');
  drawChart(data.genreList, 'genre_chart');
  drawChart(data.ratingList, 'content_chart');
  drawViewingTimeline(data.weeks, 'view_graph');
  drawReleaseTimeline(data.decades, 'movie_graph');
};
