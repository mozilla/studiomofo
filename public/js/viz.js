// FIXME
var colKeyPrefix = "gsx$";
var gDataKey = "$t";
var columnNames = {
  tempId: colKeyPrefix + "tempid",
  eventName: colKeyPrefix + "event",
  tier: colKeyPrefix + "highesttier",
  channel: colKeyPrefix + "channel",
  startDate: colKeyPrefix + "startdate",
  endDate: colKeyPrefix + "enddate"
};


var sourceUrl = "http://spreadsheets.google.com/feeds/list/1M8L-O9UQC0CbRMbKtTsfyYKBqJZekkpbA9VE8CQ20cY/od6/public/values?alt=json";
var spreadsheetData = {};
var vizAllEvents = [];
var vizEventsByTier = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: []
};
var monthAbbr = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

var viz = $("#calendar-viz");
var vizTier = $("#calendar-viz-tier");

function VizEvent(gEvent) {
  // FIXME: make sure things are using the right type
  this["id"] = vizAllEvents.length + 1; // assign real id for future reference, starts from 1
  for ( key in columnNames ) {
    var gColumnKey = columnNames[key];
    this[key] = gEvent[gColumnKey][gDataKey];
    if ( key == "startDate" || key == "endDate") {
      this[key] = new Date( gEvent[gColumnKey][gDataKey] );
    }
  }
}

$.ajax({
  url: sourceUrl,
  jsonpCallback: 'jsonCallback',
  contentType: "application/json",
  dataType: 'jsonp',
  error: function(jqXHR, textStatus, errorThrown) {
    console.log("Fail to load Google spreadsheet data...");
    console.log(jqXHR);
  },
  success: function(data) {
    spreadsheetData = data;
    mapGData(spreadsheetData);
  },
  complete: function() {
    console.log("Finish loading spreadsheet data!");
  }
});


function mapGData(data) {
  var gEvents = data.feed.entry;
  gEvents.forEach(function(gEvent){
    var vizEvent = new VizEvent(gEvent);
    vizAllEvents.push(vizEvent);
    vizEventsByTier[vizEvent["tier"]].push( vizEvent );
  });
  buildTable();
}


function buildTable() {
  drawHeader();
  for ( tier in vizEventsByTier ) {
    var tierGroup = vizEventsByTier[tier];
    tierGroup.forEach(function(theEvent){
      drawRow(theEvent, tier);
    });
    viz.find("tr[data-tier="+ tier +"]:last").addClass("tier-divider");
    drawTierLabel(tier, tierGroup); // FIXME: to be deleted
    drawTierTable(tier, tierGroup);
  }
  addEventHandler();
}

function drawTierTable(tier,tierGroup) {
  tierGroup.forEach(function(theEvent, i){
    var trOpen = "<tr data-tier="+ tier +">";
    var trClose = "</tr>";
    if ( i == 0 ) {
      vizTier.find("tbody").append(trOpen +
                                      "<td class='tier-label' rowspan=" + tierGroup.length + " data-rowspan='"+ tierGroup.length +"'>" + tier + "</td>" +
                                   trClose);
    }else {
      vizTier.find("tbody").append(trOpen + trClose);
    }
  });
}

function drawHeader() {
  // FIXME: make use of <col>
  var colGroupHtml = "";
  var headerHtml = "";
  // build colGroup and headerHtml
  colGroupHtml += "<col class='tier'></col>"
  headerHtml = "<th>Tier</th>";
  for (var i=0; i<12; i++) {
    colGroupHtml += "<col class='month " + monthAbbr[i] + "'></col>";
    headerHtml += "<th>" + monthAbbr[i] + "</th>";
  }
  colGroupHtml += "<col class='eventCol'></col>";
  headerHtml += "<th class='event-name'>Event</th>";
  // insert to DOM
  viz.find("thead").before("<colgroup>"+ colGroupHtml + "</colgroup>")
                   .append("<tr>"+ headerHtml + "</tr>");
}


function drawRow(theEvent, tier) {
  var rowHtml = "";
  var month = theEvent.startDate.getMonth(); // index starts from 0
  // find and mark event month slot
  for (var i=0; i<12; i++) {
    if ( i == month ) {
      rowHtml += "<td class='month marked'><div class='dot'></div></td>"
    }else {
      rowHtml += "<td class='month'></td>";
    }
  }
  // disply event name
  rowHtml += "<td class='event-name'>"+ theEvent["eventName"] +"</td>";
  viz.find("tbody").append("<tr data-id=" +  theEvent.id + " data-tier=" + tier + ">" +
                                        rowHtml +
                                  "</tr>");
}

function drawTierLabel(tier,tierGroup) {
  viz.find("tr[data-tier="+ tier +"]").prepend("<td class='tierLabel'>"+tier+"</td>");
}



// ==================

function addEventHandler() {
  // show Event description
  viz.find("tbody").find(".dot, .event-name").click(showDetails);
  // toggle each Tier section
  vizTier.find("td").click(toggleTier);
}

// Show Event description click handler
function showDetails(event) {
  $("#description-box #event-details").html("");
  viz.find("tr[data-id].selected").removeClass("selected");
  // get currently selected Event
  var id = $(this).parents("tr[data-id]").addClass("selected").attr("data-id");
  var selected = vizAllEvents[(id-1)];
  // update content
  $("#event-title").text(selected.eventName);
  for( key in selected ) {
    var listItem = "";
    if ( key == "channel") {
      listItem += "<li><b class='desc-label'>" + key + "</b><br />";
      var channels = selected[key].split(",");
      for (var i=0; i<channels.length; i++) {
        listItem += channels[i] + "</ br>";
      }
      listItem += "</li>";
    } else {
      listItem =  "<li>" +
                   "<b class='desc-label'>" + key + "</b>" + selected[key] +
                  "</li>";
    }
    $("#event-details").append(listItem);
  }
}

// Toggle Tier click handler
function toggleTier(event) {
  var tier = $(event.target).parents("tr[data-tier]").attr("data-tier");
  // main viz
  viz.find("tr[data-tier="+ tier +"]:not(:last)").toggle();
  viz.find("tr[data-tier="+ tier +"]:last *").toggle();
  // tier table viz ("vertical header")
  var tierLabelRow = vizTier.find("tr[data-tier="+ tier +"]:first").toggleClass("collapsed");
  var actualRowSpan = tierLabelRow.find("td").attr("data-rowspan");
  vizTier.find("tr[data-tier="+ tier +"]:not(:first)").toggle();
  if ( tierLabelRow.hasClass("collapsed") ) {
    tierLabelRow.find("td").attr("rowspan", 1);
  }else {
    tierLabelRow.find("td").attr("rowspan", actualRowSpan);
  }
}
