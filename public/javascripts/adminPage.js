$(function() {
  $.get('/admin/api/tickets', function(data) {
    $('#friday7tickets').text('Friday @ 7:00--  ' + data.F7);
    $('#friday9tickets').text('Friday @ 9:00--  ' + data.F9);
    $('#saturday7tickets').text('Saturday @ 7:00--  ' + data.S7);
    $('#saturday9tickets').text('Saturday @ 9:00--  ' + data.S9);
  });

});