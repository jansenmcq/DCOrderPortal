$(function() {

  var calculateTotal = function() {
    var f7 = parseInt($('#friday7tickets').val());
    var f9 = parseInt($('#friday9tickets').val());
    var s7 = parseInt($('#saturday7tickets').val());
    var s9 = parseInt($('#saturday9tickets').val());
    var total = (f7 + f9 + s7 + s9) * 5;
    $('#cost').text('Total: $'+total+'.00');
  }
  $('.ticketInput').change(function() {
    calculateTotal();
  });

  $('#submitData').click(function() {
    $.post('/checkout',
      {
        name: $('#name').val(),
        email: $('#email').val(),
        friday7Tickets: $('#friday7tickets').val(),
        friday9Tickets: $('#friday9tickets').val(),
        saturday7Tickets: $('#saturday7tickets').val(),
        saturday9Tickets: $('#saturday9tickets').val()
      }
     )/*
    $.post('/checkout', $('#ticketForm').serialize(), function() {


    })*/
    .done(function(msg) {
      //var formData={}
      //$.post(cashnetSiteURL, {}).done();
      console.log("Returned: " + msg);
    });
  });
});