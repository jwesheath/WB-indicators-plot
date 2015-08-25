### Description
This was largely an exercise to learn how to create interactive plots with the [D3.js](http://d3js.org/) JavaScript library and how to manipulate data with the [Pandas](http://pandas.pydata.org/) package for [Python](https://www.python.org/).  I also wanted to try out the [World Bank Data API](http://data.worldbank.org/node/9) and began to query the API directly with the [requests](http://docs.python-requests.org/en/latest/) package before realizing Pandas has built-in functions for doing just that.    

`get_data.py` queries the World Bank Data for specific indicators from all countries and generates a JSON file of the returned data and an HTML file that contains an interactive D3 bubble plot.  Users can interactively select variables for the plot's X and Y axes, select which regions are displayed, and inspect individual countries.  Bubbles are sized by population and colored by world region.  `D3bubbleplot.js` contains the JavaScript for the plot and `styles.css` contains all the CSS.  The indicators to be returned are specified in a list at the top of `get_data.py` and are easily modified.  The ones currently included were chosen more or less at random.  A list of all the World Bank Data indicators can be found [here](http://data.worldbank.org/indicator).  The indicator codes that need to be specified in `get_data.py` seem to be most easily found in the URL for a particular indicator.

### Requirements
- [Python](https://www.python.org/) and [Pandas](http://pandas.pydata.org/)

### Usage
Download this repo...

```
git clone https://github.com/jwesheath/WB-indicators-plot.git
```

... and run `get_data.py`.

```
python get_data.py
```

Two files will be generated: `data.js` contains the data and `index.html` contains the plot.  Different indicators for the plot can be specified at the top of `get_data.py`.  

### Demo
See a demo of the generated plot [here](http://jwesheath.github.io/WB-indicators-plot).
