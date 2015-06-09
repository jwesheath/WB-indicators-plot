// Margins, width and height for SVG/plot element
var margin = {top:30, right: 75, bottom: 75, left: 100};
var width = 1200 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;

// Times for animations/transitions
var fadeTime = 700;
var labelResizeTime = 400;
var moveTime = 1500;
var delayTime = 150;

// Program behaves differently before X and Y variable are both chosen for first time
var firstRun = true;

// Sort data by population size so that smaller nodes get drawn on top.
// The 'data' variable has already been assigned in data.js
data = data.sort(function(a, b) { return b.pop - a.pop; });

// Setup svg element and add it to #chart-div
var svg = d3.select("#chart-div")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Population radius scale, colors, and formatters
var radius = d3.scale.sqrt().domain([0, d3.max(data, function(d) {return d.pop;})]).range([5, 15]);
var colors = d3.scale.category10();
var commaFormatter = d3.format(",.0f");
var dollarFormatter = d3.format("$,.0f");
var percentFormatter = function(x) {return Math.round(x) + "%";}

// Create empty g.node elements in the SVG and bind a data point (country) to each one
var countryNodes = svg.selectAll("g.node")
                        .data(data, function(d) { return d.country; })
                        .enter()
                        .append("g")
                        .attr("class", "node")
                        .attr("transform", function(d) {return "translate(" + width/2 + "," + height/2 + ")";});

// Add bubbles to the nodes, make them "hidden" at first
countryNodes.append("circle")
                .attr("class", "dot")
                .attr("stroke-width", "3")
                .attr("stroke", function(d) {return d3.rgb(colors(d.region)).darker();})
                .attr("fill", function(d) {return colors(d.region);})
                .attr("r", 0);
            
// Add labels to nodes, make them "hidden" at first
countryNodes.append("text")
                .attr("dy", +20)
                .style("font-size", "10")
                .style("text-anchor", "middle")
                .style("opacity", "0")
                .text(function(d) {return d.country;});

// Create g elements for axes
svg.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + height + ")");
svg.append("g")
    .attr("class", "yaxis");

// Create text elements for axes labels
svg.append("text")
    .attr("class", "xlab")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .style("opacity", "0");
svg.append("text")
    .attr("class", "ylab")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(" + -60 + "," + height / 2 + ")rotate(-90)")
    .style("opacity", "0");
    

/* Plot Control Functions */

/*
    When either var select dropdown changes, change axis and move points to reflect new variable
*/
d3.selectAll("select").on("change", function() {

    // Get new variables from plot control dropdowns
    var xvar = document.getElementById("xvar").value;
    var yvar = document.getElementById("yvar").value;

    // Don't do anything if either variable is still empty
    if (xvar == 'empty' || yvar == 'empty') {return;}

    // Get types and labels for both variables
    var xvartype = indicators[xvar]['type'];
    var xlab = indicators[xvar]['label'];
    var yvartype = indicators[yvar]['type'];
    var ylab = indicators[yvar]['label'];

    // If this is the first run, fade bubbles and labels into view and draw axes
    if (firstRun) {
        d3.selectAll(".dot").transition().duration(fadeTime+1000)
            .attr("r", function(d) {return radius(d.pop);});
        d3.selectAll("g.node text").transition().duration(fadeTime+1000)
            .style("opacity", "1");
        d3.select(".xlab")
            .transition().text(xlab)
            .transition().duration(moveTime).style("opacity", "1");
        d3.select(".ylab")
            .transition().text(ylab)
            .transition().duration(moveTime).style("opacity", "1");
        firstRun = false;
    }

    // Build the new scales and axes based on the var types
    switch(xvartype) {
        case 'number':
            var max = d3.max(data, function(d) { return d[xvar] ;});
            max = max + (max * 0.05);
            var x = d3.scale.linear().domain([0, max]).range([0, width]);
            var xAxis = d3.svg.axis().scale(x);
            break;
        case 'percent':
            var x = d3.scale.linear().domain([0, 100]).range([0, width]);
            var xAxis = d3.svg.axis().scale(x).ticks(11).tickFormat(function(d) { return d + "%" ;});
            break;
        case 'dollar':
            var min = d3.min(data, function(d) { return d[xvar] ;});
            min = min - (min * 0.05);
            var max = d3.max(data, function(d) { return d[xvar] ;});
            max = max + (max * 0.05);
            var x = d3.scale.log().domain([min, max]).range([0, width]);
            var xAxis = d3.svg.axis().scale(x).ticks(7, "$,d");
            break;
    }
    switch(yvartype) {
        case 'number':
            var max = d3.max(data, function(d) { return d[yvar] ;});
            max = max + (max * 0.05);
            var y = d3.scale.linear().domain([0, max]).range([height, 0]);
            var yAxis = d3.svg.axis().scale(y).orient("left");
            break;
        case 'percent':
            var y = d3.scale.linear().domain([0, 100]).range([height, 0]);
            var yAxis = d3.svg.axis().scale(y).orient("left").ticks(11).tickFormat(function(d) { return d + "%" ;});
            break;
        case 'dollar':
            var min = d3.min(data, function(d) { return d[yvar] ;});
            min = min - (min * 0.05);
            var max = d3.max(data, function(d) { return d[yvar] ;});
            max = max + (max * 0.05);
            var y = d3.scale.log().domain([min, max]).range([height, 0]);
            var yAxis = d3.svg.axis().scale(y).orient("left").ticks(7, "$,d");
            break;
    }

    // Transition to the new axes
    d3.select(".xaxis").transition().delay(delayTime).duration(moveTime).call(xAxis);
    d3.select(".yaxis").transition().delay(delayTime).duration(moveTime).call(yAxis);

    // Only change label for variable that changed
    // Ignore this on first run
    if (!firstRun) {
        var changed = this['id'];
        switch (changed) {
            case 'xvar':
                d3.select(".xlab").transition().duration(moveTime/3).style("opacity", "0")
                                    .transition().text(xlab)
                                    .transition().duration(moveTime/3).style("opacity", "1");
                break;
            case 'yvar':
                d3.select(".ylab").transition().duration(moveTime/3).style("opacity", "0")
                                    .transition().text(ylab)
                                    .transition().duration(moveTime/3).style("opacity", "1");       
                break;
        }
    }

    // Translate all points to reflect new x and y values
    countryNodes.transition().delay(delayTime).duration(moveTime)
                    .attr("transform", function(d) {return "translate(" + x(d[xvar]) + "," + y(d[yvar]) + ")";});
});


/*
    Filter currently displayed regions to UHO Region checkboxes
*/
d3.selectAll(".regionFilter").on("change", function() {
    
    // Get the value of the changed checkbox
    var regionvar = this.value;

    // Check if labels are currently on or off
    var labels = document.getElementById("labelsCheck").checked;

    // When region box is checked...
    if (this.checked) {

        // Draw .dots for that region
        d3.selectAll(".dot")
            .filter(function(d) {return d.regionvar == regionvar;})
            .transition().duration(fadeTime)
            .attr("r", function(d) {return radius(d.pop);});

        // If labelsCheck is checked, add labels
        if (labels) {
            d3.selectAll("g.node text")
                .filter(function(d) {return d.regionvar == regionvar;})
                .transition().duration(fadeTime)
                .style("opacity", "1");
        }

    // When region box is unchecked... 
    } else {

        // Shrink .dots to r = 0
        d3.selectAll(".dot")
            .filter(function(d) {return d.regionvar == regionvar;})
            .transition().duration(fadeTime)
            .attr("r", "0");

        // Remove labels
        d3.selectAll("g.node text")
            .filter(function(d) {return d.regionvar == regionvar;})
            .transition().duration(fadeTime)
            .style("opacity", "0");
    }
});


/*
    Update labels based on labelsCheck checkbox
*/
d3.select("#labelsCheck").on("change", function() {

    // When checked...
    if (document.getElementById("labelsCheck").checked) {

        // Add labels for all visible bubbles (r > 0)
        d3.selectAll("g.node")
            .filter(function(d) {return d3.select(this).select(".dot").attr("r") > 0;})
            .select("text")
            .transition().duration(fadeTime)
            .style("opacity", "1");

    // When unchecked...
    } else {

        // Remove labels for all visible bubbles (r > 0)
        d3.selectAll("g.node")
            .filter(function(d) {return d3.select(this).select(".dot").attr("r") > 0;})
            .select("text")
            .transition().duration(fadeTime)
            .style("opacity", "0");
    }
});

/*
    Update label size based on labelsSize slider
*/
d3.select("#labelsSize").on("change", function() {
    
    // Get slider value
    newFontSize = this.value;

    // Resize labels
    d3.selectAll("g.node text")
        .transition().duration(labelResizeTime)
        .style("font-size", newFontSize);
});


// Tooltips appear on mouseover
d3.selectAll("g.node").on("mouseover", function(d) {

    // Select all .dots and increase border width
    d3.select(this).select(".dot")
                    .transition()
                    .attr("stroke-width", "7");

    // Get currently selected vars, types, and labels for tooltip       
    var xvar = document.getElementById("xvar").value;
    var xtype = indicators[xvar]['type'];
    var xlab = indicators[xvar]['label'];
    var yvar = document.getElementById("yvar").value;
    var ytype = indicators[yvar]['type'];
    var ylab = indicators[yvar]['label'];

    // Get this .dot's colors to make tooltip match
    var tooltipFill = d3.select(this).select(".dot").attr("fill");
    var tooltipBorder = d3.select(this).select(".dot").attr("stroke");

    // Get mouseover position
    var xPos = parseFloat(d3.event.pageX);
    var yPos = parseFloat(d3.event.pageY);

    // Add data to the tooltip div
    d3.select("#tooltip")
        .select("#countryname")
        .text(d.country);
    d3.select("#tooltip")
        .select("#pop")
        .text(commaFormatter(d.pop));   

    // Format numbers for tooltip based on the variable's type
    switch(indicators[xvar]['type']) {
        case 'number':
            d3.select("#tooltip")
                .select("#xvartip")
                .text(xlab + ': ' + commaFormatter(d[xvar]));
            break;
        case 'percent':
            d3.select("#tooltip")
                .select("#xvartip")
                .text(xlab + ': ' + percentFormatter(d[xvar]));
            break;
        case 'dollar':
            d3.select("#tooltip")
                .select("#xvartip")
                .text(xlab + ': ' + dollarFormatter(d[xvar]));
            break;
    }
    switch(indicators[yvar]['type']) {
        case 'number':
            d3.select("#tooltip")
                .select("#yvartip")
                .text(ylab + ': ' + commaFormatter(d[yvar]));
            break;
        case 'percent':
            d3.select("#tooltip")
                .select("#yvartip")
                .text(ylab + ': ' + percentFormatter(d[yvar]));
            break;
        case 'dollar':
            d3.select("#tooltip")
                .select("#yvartip")
                .text(ylab + ': ' + dollarFormatter(d[yvar]));
            break;
    }

    // Position div and make it appear
    d3.select("#tooltip")
        .style("background", tooltipFill)
        .style("border", "5px solid " + tooltipBorder)
        .style("left", xPos + "px")
        .style("top", yPos + "px")
        .transition().duration(fadeTime/2)
        .style("opacity", "1");
    
})

// Tooltips disappear on mouseout...
.on("mouseout", function() {

    // Return selected .dot's border width to normal
    d3.select(this).select(".dot")
        .transition()
        .attr("stroke-width", "3");

    // Fade out tooltip
    d3.select("#tooltip")
        .transition().duration(fadeTime/2)
        .style("opacity", "0");
});
