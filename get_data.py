import pandas as pd
from pandas.io import wb
import requests
import json
import re
import time

'''
Select World Bank indicators
The 'indicators' variable is a list of lists, where each list represents
a variable and consists of a user assigned variable name, the World Bank
variable name, the variable type, and a variable label.  Variable type
must be 'number', 'dollar', or 'percent'.
               Var Name     World Bank Var Name  Var Type   Var Label
'''
indicators = [['gni',       'NY.GNP.PCAP.PP.CD', 'dollar',  'GNI per capita, PPP (current international $)'],
              ['lifeexp',   'SP.DYN.LE00.IN',    'number',  'Life Expectancy at Birth (years)'],
              ['under5',    'SH.DYN.MORT',       'number',  'Mortality Rate, under 5 (per 1,000 live births)'],
              ['prenatal',  'SH.STA.ANVC.ZS',    'percent', 'Pregnant women receiving prenatal care (%)'],
              ['impsan',    'SH.STA.ACSN',       'percent', 'Improved sanitation facilities (% of population with access)'],
              ['dpt',       'SH.IMM.IDPT',       'percent', 'Immunization, DPT (% of children ages 12-23 months)'],
              ['healthexp', 'SH.XPD.PCAP',       'dollar',  'Health expenditure per capita (current US$)']]




# Specify earliest year to look for data
start_year = 2005

# Population must be included
indicators.append(['pop', 'SP.POP.TOTL', 'number', 'Population'])

# Query the World Bank Data API directly to get basic info for all countries
request_data = requests.get('http://api.worldbank.org/countries?format=json&per_page=500').json()[1]

# All we want from the response data are the names and regions of all countries
# and we don't need the labels to tell us "(all income levels)"
regions = [(d['name'], re.sub(r'\ \(all income levels\)', '', d['region']['value'])) for d in request_data]

# Turn that list of tuples into a named Pandas DataFrame
regions = pd.DataFrame(regions, columns = ['country', 'region'])

# Use Pandas' World Bank Data API to get our indicators for all countries
data = wb.download(indicator = [i[1] for i in indicators],
                   country = ['all'], start = start_year, end = 2013)

# Make 'country' index a column, select the most recent row from each country
# where NO data are missing
data = data.reset_index().dropna().sort(['country', 'year'], ascending = [1, 0]).groupby('country').first()

# Make country a column again
data = data.reset_index()

# Rename columns
data.columns = ['country', 'year'] + [i[0] for i in indicators]

# Merge in regions
data = pd.merge(data, regions, left_on = 'country', right_on = 'country', how = 'left')

# Create shortened version of region for use in D3 code
data['regionvar'] = data.region.str[0:3]

# Get rid of "Aggregates" region (Arab World, etc.) - we only want countries
data = data[data.region != 'Aggregates']

# Convert data and indicators to dicts for use in D3
data_dict = data.to_dict('records')
indicators_dict = {i[0]: {'type': i[2], 'label': i[3]} for i in indicators}

# Output data and indicator info as a JSON file
with open('data.js', 'w') as json_file:
    json_file.write('var data = ' + json.dumps(data_dict) + ';')
    json_file.write('var indicators = ' + json.dumps(indicators_dict) + ';')

# HTML chunks
html_top = '''
<!DOCTYPE html>
<head>
  <title>World Bank Indicators</title>
  <link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/normalize/3.0.2/normalize.min.css" />
  <link rel="stylesheet" type="text/css" href="styles.css">
  <script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
</head>
<body>
  <div id = "page-wrapper">
    <div id="controls-wrapper">
      <h1>Plot Controls</h1>
      <hr>
      <div class="form-block">
        <label for="xvar">Variable on X axis</label>
        <select id="xvar" name="xvar_select" class="form-control">
          <option value="empty" selected disabled style="display: none;">Select an option</option>
'''
html_var = '<option value="{var}">{label}</option>'
html_middle = '''
        </select>
      </div>
      <div class="form-block">
        <label for="yvar">Variable on Y axis</label>
        <select id="yvar" name="yvar_select" class="form-control">
          <option value="empty" selected disabled style="display: none;">Select an option</option>
'''
html_bottom = '''
        </select>
      </div>
      <div class="form-block">
      <label for="regionCheck">Regions</label>
        <fieldset id="regionCheck" class="form-control">
          <input class="regionFilter" type="checkbox" id="Eas" value="Eas" checked><label for="Eas">East Asia & Pacific</label></br>
          <input class="regionFilter" type="checkbox" id="Eur" value="Eur" checked><label for="Eur">Europe & Central Asia</label></br>
          <input class="regionFilter" type="checkbox" id="Lat" value="Lat" checked><label for="Lat">Latin America & Caribbean</label></br>
          <input class="regionFilter" type="checkbox" id="Mid" value="Mid" checked><label for="Mid">Middle East & North Africa</label></br>
          <input class="regionFilter" type="checkbox" id="Nor" value="Nor" checked><label for="Nor">North America</label></br>
          <input class="regionFilter" type="checkbox" id="Sou" value="Sou" checked><label for="Sou">South Asia</label></br>
          <input class="regionFilter" type="checkbox" id="Sub" value="Sub" checked><label for="Sub">Sub-Saharan Africa</label>
        </fieldset>
      </div>
      <div class="form-block">
        <input id="labelsCheck" type="checkbox" class="form-control" checked><label for="labelsCheck">Labels</label></br>
      </div>
      <div class="form-block">
        <label for="labelsSize">Label Size</label></br>
        <input id="labelsSize" type="range" value="10" min="6" max="16" step="2" class="form-control">
      </div>
    </div>
    <div id="chart-wrapper">
      <div id="chart-div">
        <div id="tooltip">
          <p id="countryname"></p>
          <p>Population: <span id="pop"></span></p>
          <p id="xvartip"></p>
          <p id="yvartip"></p>
        </div>
      </div>
      <text id="footnote">Data from World Bank Open Data: <a href="http://data.worldbank.org" target="_blank">
                            http://data.worldbank.org</a>.  Retrieved on {date}.</text>
    </div>
  </div>
  <script src="data.js"></script>
  <script src="D3bubbleplot.js"></script>
</body>
'''

# Today's date for footnote
date = time.strftime("%d/%m/%Y")

# Concatenate HTML chunks, populating dropdowns with var labels
output = html_top
for i in indicators[:len(indicators) - 1]:
    output += html_var.format(var = i[0], label = i[3])
output += html_middle
for i in indicators[:len(indicators) - 1]:
    output += html_var.format(var = i[0], label = i[3])
output += html_bottom.format(date = date)

# Output HTML file
with open('index.html', 'w') as html_file:
    html_file.write(output)
