anychart.onDocumentReady(function () {
    // svgImage as string

    svgImage = '<svg xmlns="https://www.w3.org/2000/svg">' +
        '<g data-ac-wrapper-id="3">' +
        '<circle id="1" cx="50" cy="50" r="20" fill="#90caf9" stroke="black"></circle>' +
        '<circle id="2" cx="150" cy="50" r="20" fill="#80cbc4" stroke="black"></circle>' +
        '<circle id="3" cx="100" cy="100" r="20" fill="#aed581" stroke="black"></circle>' +
        '</g></svg>';

    // sample data
    var dataSet = anychart.data.set([
        ['1', 300],
        ['2', 230]
    ]);

    // mapping the data to the chart
    mapDataSet = dataSet.mapAs({id: 0, value: 1});

    var map = anychart.map();
    map.geoData(svgImage);

    map.title('SVG Sample Map');

    // set the series
    var series = map.choropleth(mapDataSet);
    series.geoIdField('id');

    // disable the labels
    series.labels(false);

    // draw a map
    map.container('container');
    map.draw();
});
