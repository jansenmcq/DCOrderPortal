$(function() {

    $.get('/admin/api/tickets', function(data) {
        if (data.F7 <= 0) {
            $('#fri7 input').prop('disabled', true);
            $('#fri7 span').addClass('disabled');
        }
        if (data.F9 <= 0) {
            $('#fri9 input').prop('disabled', true);
            $('#fri9 span').addClass('disabled');
        }
        if (data.S7 <= 0) {
            $('#sat7 input').prop('disabled', true);
            $('#sat7 span').addClass('disabled');
        }
        if (data.S9 <= 0) {
            $('#sat9 input').prop('disabled', true);
            $('#sat9 span').addClass('disabled');
        }
    });

    var calculateTotal = function() {
        var f7 = parseInt($('#friday7tickets').val()) ? parseInt($('#friday7tickets').val()) : 0;
        var f9 = parseInt($('#friday9tickets').val()) ? parseInt($('#friday9tickets').val()) : 0;
        var s7 = parseInt($('#saturday7tickets').val()) ? parseInt($('#saturday7tickets').val()) : 0;
        var s9 = parseInt($('#saturday9tickets').val()) ? parseInt($('#saturday9tickets').val()) : 0;
        var numberOfTickets = f7 + f9 + s7 + s9;
        var total = numberOfTickets * 5;
        $('#cost').text('Total: $'+total+'.00');
        $('#totalCost').val(''+total+'.00');
        $('#quantity').val(numberOfTickets);
        return {F7: f7, F9: f9, S7: s7, S9: s9};
    };

    var validateData = function() {
        var ready = true;
        if (!$('#name').val()) {
            $('#nameTitle').after('<p class="validationError"> Make sure you include your name!<p></p>');
            ready = false;
        }
        if (!$('#email').val()) {
            $('#emailTitle').after('<p class="validationError"> Make sure you include your email!<p>');
            ready = false;
        }
        if (!parseInt($('#friday7tickets').val()) &&
            !parseInt($('#friday9tickets').val()) &&
            !parseInt($('#saturday7tickets').val()) &&
            !parseInt($('#saturday9tickets').val())) {
            $('#errorMessage').text('You can\'t check out when you haven\'t selected any tickets!').show();
            ready = false;
        }
        return ready;
    };

    var formatForm = function(ticketCounts) {
        var itemNumber = 1;
        for (show in ticketCounts) {
            if (ticketCounts[show] > 0) {
                $('#hiddenForm').append('<input type="hidden" name="itemcode'+itemNumber+'" value="WEBDC-O'+show+'">');
                $('#hiddenForm').append('<input type="hidden" name="qty'+itemNumber+'" value="'+ticketCounts[show]+'">');
                $('#hiddenForm').append('<input type="hidden" name="amount'+itemNumber+'" value="'+ticketCounts[show] * 5+'">');
                itemNumber++;
            }
        }
    };

    var validateAndSubmitData = function() {
        var ticketTotals = calculateTotal();
        $('#errorMessage').text('').hide();
        $('.validationError').remove();
        if (!validateData()) {
            return;
        }

        $('#submitData').off();
        $('#checkoutText').text('');
        $('#pageLoad').show();
        $.post('/checkout',
            {
                name: $('#name').val(),
                email: $('#email').val(),
                friday7Tickets: parseInt($('#friday7tickets').val()) ? parseInt($('#friday7tickets').val()) : 0,
                friday9Tickets: parseInt($('#friday9tickets').val()) ? parseInt($('#friday9tickets').val()) : 0,
                saturday7Tickets: parseInt($('#saturday7tickets').val()) ? parseInt($('#saturday7tickets').val()) : 0,
                saturday9Tickets: parseInt($('#saturday9tickets').val()) ? parseInt($('#saturday9tickets').val()) : 0
            }
        )
            .done(function(response) {
                if (response.error) {
                    var error = response.error;
                    var errorMessage = 'Regrettably, there are not enough tickets to fulfill your request. '
                    if (error.F7) {
                        errorMessage += 'For the Friday show at 7:00, there are only ' + error.F7 + ' tickets left. ';
                    }
                    if (error.F9) {
                        errorMessage += 'For the Friday show at 9:00, there are only ' + error.F9 + ' tickets left. ';
                    }
                    if (error.S7) {
                        errorMessage += 'For the Saturday show at 7:00, there are only ' + error.S7 + ' tickets left. ';
                    }
                    if (error.S9) {
                        errorMessage += 'For the Saturday show at 9:00, there are only ' + error.S9 + ' tickets left.';
                    }
                    $('#errorMessage').text(errorMessage).show();
                    $('#submitData').click(validateAndSubmitData);
                    $('#checkoutText').text('Checkout');
                    $('#pageLoad').hide();
                } else {
                    formatForm(ticketTotals);
                    $('#emailInput').val($('#email').val());
                    $('#lastName').val($('#email').val());
                    $('#firstName').val($('#name').val());
                    $('#nameRef').val($('#name').val());
                    $('#custCode').val($('#email').val());
                    $('#emailRef').val($('#email').val());
                    $('#logoutURL').val('http://52.24.221.243/checkout/logout/' + $('#email').val());
                    $('#hiddenForm').submit();
                }
            });
    };

    $('.ticketInput').change(function() {
        calculateTotal();
    });

    $('#submitData').click(validateAndSubmitData);

});