// ****************************
// Home Page
if ( $("body").hasClass("home") ){
  $("#request-need-tweet").click(function(event){
    $("#request-tweet").toggleClass("hidden");
  });
}



// ****************************
// Projects Page
if ( $("body").hasClass("projects") ){
  $.ajax({
    url: "https://api-dev.bugzilla.mozilla.org/1.3/bug",
    type: "GET",
    dataType: 'json',
    data: {
      bug_status: "NEW ASSIGNED",
      bug_status_type: "contains_any",
      whiteboard_type: "allwordssubstr",
      whiteboard: "studiomofo",
      whiteboard: "studio mofo"
    },
    contentType: "application/json",
    error: function(jqXHR, textStatus){
      console.log("eeerrrorrrr");
      console.log(textStatus);
    },
    success: function(data){
      console.log("Successfully loaded bug list.  Total open tickets: "+ data.bugs.length);
      $("#loading-buzilla").addClass("hidden");
      for ( var i=0; i<data.bugs.length; i++){
        var bug = data.bugs[i];
        $("#bug-list table").find("tbody").append(
          "<tr>" +
            "<td><a href='https://bugzilla.mozilla.org/show_bug.cgi?id="+ bug.id +"'>" + bug.id + "</a></td>" +
            "<td>" + bug.summary + "</td>" +
          "</tr>");
      }
    }
  });
}
