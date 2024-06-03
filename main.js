var bfdata;
var previousClickedState = null;
document.addEventListener('DOMContentLoaded', function () {
    d3.csv('data-with-states.csv').then(function (data) {
        bfdata = data
        bfdata = data.map(function (d) {
            return {
                number: +d.number,
                title: d.title,
                classification: d.classification,
                timestamp: new Date(d.timestamp),
                latitude: +d.latitude,
                longitude: +d.longitude,
                state: d.NAME
            };
        });


        drawMap();
        generateWordCloud(bfdata);
        updateStatistics();
        drawEmptyMap();
        displayBigfootImages();
        setInterval(displayBigfootImages, 1000);
    });
});


function selectAll(source) {
    selectall = document.getElementsByName("selectAll");
    checkboxes = document.getElementsByName("checkbox");
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = source.checked;
    }
    drawChart();
}


function drawMap() {

    var svg = d3.select("#map")
        .append("svg")
        .attr("viewBox", "-70 -50 1070 700")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

    var path = d3.geoPath();

    d3.json('us.json').then(function (us) {


        svg.append("path")
            .attr("stroke-width", "0.5")
            .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

        svg.append("path")
            .attr("d", path(topojson.feature(us, us.objects.nation)));

        drawHeatmap();

    });

}


function updateStatistics(filteredData) {
    var totalReports = bfdata.length;

    var selectedClassifications = [];
    checkboxes = document.getElementsByName("checkbox");

    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedClassifications.push(checkboxes[i].value);
        }
    }

    var filteredData = bfdata.filter(function (d) {
        return selectedClassifications.includes(d.classification);
    });

    var filteredReports = filteredData.length;

    var statisticsDiv = document.getElementById('statistics');
    statisticsDiv.innerHTML = 'Total Reports: ' + totalReports + '<br>' + 'Filtered Reports: ' + filteredReports;
}

function drawChart() {
    var selectedClassifications = [];
    checkboxes = document.getElementsByName("checkbox");

    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedClassifications.push(checkboxes[i].value);
        }
    }

    var filteredData = bfdata.filter(function (d) {
        return selectedClassifications.includes(d.classification);
    });

    updateMap(filteredData);
    drawHeatmap(filteredData);
    generateWordCloud(filteredData);
    
    updateStatistics(filteredData);
}

function drawHeatmap(filteredData) {
    var selectedClassifications = [];
    checkboxes = document.getElementsByName("checkbox");

    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedClassifications.push(checkboxes[i].value);
        }
    }
    var filteredData = bfdata.filter(function (d) {
        return selectedClassifications.includes(d.classification);
    });

    var sightingsByState = d3.rollup(filteredData, v => v.length, d => d.state);


    var colorScale = d3.scaleSequential(d3.interpolateGreens)
        .domain([0, d3.max(Array.from(sightingsByState.values()))]);

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    d3.json('us.json').then(function (us) {
        d3.select("svg")
            .selectAll('.state')
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append('path')
            .attr('class', 'state')
            .attr('d', d3.geoPath())
            .style('fill', function (d) {
                var stateData = sightingsByState.get(d.properties.name);
                return stateData ? colorScale(stateData) : '#ccc';
            }).on("click", handleStateClick)
            .on("mouseover", function (d) {
                var selectedClassifications = [];
                checkboxes = document.getElementsByName("checkbox");

                for (var i = 0; i < checkboxes.length; i++) {
                    if (checkboxes[i].checked) {
                        selectedClassifications.push(checkboxes[i].value);
                    }
                }
                var filteredData = bfdata.filter(function (d) {
                    return selectedClassifications.includes(d.classification);
                });

                var sightingsByState = d3.rollup(filteredData, v => v.length, d => d.state);
                var stateData = sightingsByState.get(d.currentTarget.__data__.properties.name);
                tooltip.transition()
                    .duration(0)
                    .style("display", "block")
                    .style("opacity", .9);
                tooltip.html(d.currentTarget.__data__.properties.name + "<br/>" + (stateData ? stateData : 0) + " sightings")
                    .style("left", (d.pageX) + "px")
                    .style("top", (d.pageY) + "px");
            })
            .on("mousemove", function (d) {
                var selectedClassifications = [];
                checkboxes = document.getElementsByName("checkbox");

                for (var i = 0; i < checkboxes.length; i++) {
                    if (checkboxes[i].checked) {
                        selectedClassifications.push(checkboxes[i].value);
                    }
                }
                var filteredData = bfdata.filter(function (d) {
                    return selectedClassifications.includes(d.classification);
                });

                var sightingsByState = d3.rollup(filteredData, v => v.length, d => d.state);
                var stateData = sightingsByState.get(d.currentTarget.__data__.properties.name);
                tooltip.transition()
                    .duration(0)
                    .style("display", "block")
                    .style("opacity", .9);
                tooltip.html(d.currentTarget.__data__.properties.name + "<br/>" + (stateData ? stateData : 0) + " sightings")
                    .style("left", (d.pageX) + "px")
                    .style("top", (d.pageY) + "px");
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });

}

function updateMap(data) {

    var sightingsByState = d3.rollup(data, v => v.length, d => d.state);

    var colorScale = d3.scaleSequential(d3.interpolateGreens)
        .domain([0, d3.max(Array.from(sightingsByState.values()))]);

    d3.json('us.json').then(function (us) {
        d3.select("svg")
            .selectAll('.state')
            .data(topojson.feature(us, us.objects.states).features)
            .style('fill', function (d) {
                var stateData = sightingsByState.get(d.properties.name);
                return stateData ? colorScale(stateData) : '#ccc';
            });
    });

}

function generateWordCloud(data) {

    var wordFrequencies = {};
    data.forEach(function (d) {
        var words = d.title.split(' '); 
        words.forEach(function (word) {
            word = word.toLowerCase(); 
            if (!(/^\d+$/.test(word) || /^\d+:$/.test(word))) {
                if (word.length >= 5 && word !== 'report') { 
                    if (wordFrequencies[word]) {
                        wordFrequencies[word]++;
                    } else {
                        wordFrequencies[word] = 1;
                    }
                }
            }
        });
    });


    var sortedWords = Object.keys(wordFrequencies).sort(function (a, b) {
        return wordFrequencies[b] - wordFrequencies[a];
    });


    var maxWordsToShow = 30; 
    var topWords = sortedWords.slice(0, maxWordsToShow);


    var words = topWords.map(function (word, index) {
        return { text: word, size: 10 + Math.random() * 90, color: d3.schemeCategory10[index % 10] }; 
    });


    d3.select("#word-cloud svg").remove();


    var layout = d3.layout.cloud()
        .size([830, 540]) 
        .words(words)
        .padding(5)
        .rotate(function () { return ~~(Math.random() * 2) * 90; }) 
        .fontSize(function (d) { return d.size; })
        .on("end", draw);

    layout.start();

    function draw(words) {
        d3.select("#word-cloud").append("svg")
            .attr("width", layout.size()[0])
            .attr("height", layout.size()[1])
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function (d) { return d.size + "px"; })
            .style("fill", function (d) { return d.color; })
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function (d) { return d.text; });

        
        d3.select("#word-cloud")
            .selectAll("text")
            .style("opacity", 0) 
            .transition()
            .duration(1000) 
            .style("opacity", 1); 
    }
}

function handleStateClick(d) {
    d3.selectAll(".state").style("stroke-width", "0.5px"); 
    d3.select(".state.selected").classed("selected", false); 

    var clickedState = d.currentTarget.__data__.properties.name;
    if (previousClickedState !== clickedState) {
        d3.select(this).classed("selected", true); 


        d3.select(this).style("stroke-width", "5px"); 

        var selectedClassifications = [];
        checkboxes = document.getElementsByName("checkbox");

        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                selectedClassifications.push(checkboxes[i].value);
            }
        }

        var filteredData = bfdata.filter(function (d) {
            return selectedClassifications.includes(d.classification);
        });

        var selectedState = d.currentTarget.__data__.properties.name;
        filteredData = filteredData.filter(function (d) {
            return d.state === selectedState;
        });

        generateWordCloud(filteredData);
    }
    previousClickedState = clickedState;
}

function drawEmptyMap() {
    // Create a new SVG for the empty map
    var mapSvg = d3.select("#empty-map")
        .append("svg")
        .attr("viewBox", "-70 -50 1070 700")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

    var path = d3.geoPath();

    d3.json('us.json').then(function (us) {
        mapSvg.append("path")
            .attr("stroke-width", "0.5")
            .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

        mapSvg.append("path")
            .attr("d", path(topojson.feature(us, us.objects.nation)));
    });
}

function displayBigfootImages() {
    // Select the SVG element where you want to append the Bigfoot images
    var svg = d3.select("#empty-map svg");

    // Coordinates for the Bigfoot images (adjust as needed)
    var imageCoordinates = [
        // washington
        { x: 60, y: 10 },
        { x: 100, y: 10},
        { x: 120, y: 40 },
        { x: 74, y: 60 },
        { x: 120, y: 80 },
        // Montanna
        { x: 250, y: 80 },

        // Oregon
        { x: 50, y: 110 },

        // Idaho
        { x: 175, y: 126 },

        // Cali
        { x: 50, y: 260 },
        { x: 40, y: 190 },
        { x: 80, y: 320 },

        // alaska
        { x: 80, y: 520 },

        // Nevada
        { x: 140, y: 260 },

        // utah
        { x: 240, y: 260 },
        // arizona
        { x: 200, y: 360 },

        // New Mexico
        { x: 300, y: 360 },

        // Texas
        { x: 400, y: 440 },
        { x: 460, y: 500 },

        // wyoming, SDakota, ND, Nebra, Okla, kansas
        { x: 280, y: 180 },
        { x: 380, y: 160 },
        { x: 450, y: 100 },
        { x: 430, y: 230 },
        { x: 400, y: 290 },
        { x: 460, y: 380 },

        // colorado
        { x: 280, y: 290 },
        { x: 340, y: 300 },

        // min, miss, iowa, aska, lousia
        { x: 500, y: 140 },
        { x: 510, y: 220 },
        { x: 550, y: 300 },
        { x: 530, y: 370 },
        { x: 540, y: 450 },

        // wiscon, michi, illi
        { x: 570, y: 160 },
        { x: 590, y: 100 },
        { x: 660, y: 160 },
        { x: 570, y: 260 },
        { x: 600, y: 230 },

        // indi, ohio
        { x: 640, y: 230 },
        { x: 740, y: 215 },
        { x: 690, y: 230 },
        { x: 710, y: 260 },

        // ken, ten, miss,ala
        { x: 640, y: 430 },
        { x: 610, y: 410 },
        { x: 660, y: 340 },
        { x: 690, y: 300 },

        // florida
        { x: 780, y: 550 },
        { x: 765, y: 500 },
        { x: 735, y: 480 },

        // georgia
        { x: 705, y: 380 },
        { x: 725, y: 440 },
        // 
        { x: 785, y: 380 },
        { x: 805, y: 340 },
        { x: 805, y: 290 },
        { x: 745, y: 280 },
        { x: 805, y: 200 },
        { x: 805, y: 250 },
        { x: 815, y: 140 },
        { x: 855, y: 120 },
        { x: 875, y: 120 },
        { x: 895, y: 100 },
        { x: 895, y: 155 },
        { x: 865, y: 175 },
        { x: 845, y: 215 },





    ];


    svg.selectAll(".bigfoot-image")
        .data(imageCoordinates)
        .each(function () {
            var isVisible = Math.random() < 0.5; 
            var mirror = Math.random() < 0.5; 
            d3.select(this)
                .attr("visibility", isVisible ? "visible" : "hidden")
                .attr("xlink:href", mirror?"bigfoot.png" : "bigfoot1.png");

        })
        .enter().append("svg:image")
        .attr("xlink:href", "bigfoot.png")
        .attr("class", "bigfoot-image")
        .attr("width", 30)
        .attr("height", 30)
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });
}
