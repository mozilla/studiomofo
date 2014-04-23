$.ajax({
  url: "https://api-dev.bugzilla.mozilla.org/1.3/bug",
  type: "GET",
  dataType: 'json',
  data: {
    bug_status: "NEW ASSIGNED",
    bug_status_type: "contains_any",
    whiteboard_type: "contains",
    whiteboard: "studiomofo"
  },
  contentType: "application/json",
  error: function(jqXHR, textStatus){
    console.log("eeerrrorrrr");
    console.log(textStatus);
  },
  success: function(data){
    console.log("success");
    console.log(data);
    var bugTable = $("#bug-list table");
    var bugs = data.bugs;

    for ( var i=0; i<bugs.length; i++){
      var bug = bugs[i];
      console.log(bug.id);
      console.log(bug.ref);
      console.log(bug.summary);
      console.log("===");
      bugTable.find("tbody").append("<tr>" +
                                      "<td><a href='https://bugzilla.mozilla.org/show_bug.cgi?id="+ bug.id +"'>" + bug.id + "</a></td>" +
                                      "<td>" + bug.summary + "</td>" +
                                    "</tr>");
    }
  }
});
