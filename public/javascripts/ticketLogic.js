$(function() {

    $.get('/ticketapi/get', function(data) {
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

    var normalizeTicketNumber = function(ticketAmount) {
        return parseInt(ticketAmount) ? parseInt(ticketAmount) : 0;
    };

    var calculateTotal = function() {
        var f7 = normalizeTicketNumber($('#friday7tickets').val());
        var f9 = normalizeTicketNumber($('#friday9tickets').val());
        var s7 = normalizeTicketNumber($('#saturday7tickets').val());
        var s9 = normalizeTicketNumber($('#saturday9tickets').val());
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

    var formatAndSubmitForm = function(ticketCounts) {
        var itemNumber = 1;
        for (show in ticketCounts) {
            if (ticketCounts[show] > 0) {
                $('#hiddenForm').append('<input type="hidden" name="itemcode'+itemNumber+'" value="WEBDC-T'+show+'">');
                $('#hiddenForm').append('<input type="hidden" name="qty'+itemNumber+'" value="'+ticketCounts[show]+'">');
                $('#hiddenForm').append('<input type="hidden" name="amount'+itemNumber+'" value="'+ticketCounts[show] * 5+'">');
                itemNumber++;
            }
        }
        $('#emailInput').val($('#email').val());
        $('#lastName').val($('#email').val());
        $('#firstName').val($('#name').val());
        $('#nameRef').val($('#name').val());
        $('#custCode').val($('#email').val());
        $('#emailRef').val($('#email').val());
        $('#logoutURL').val('http://52.24.221.243/checkout/logout/' + $('#email').val());
        $('#hiddenForm').submit();

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
                    if (error.tickets) {
                        var ticketError = error.tickets;
                        var errorMessage = 'Regrettably, there are not enough tickets to fulfill your request. '
                        if (ticketError.F7) {
                            errorMessage += 'For the Friday show at 7:00, there are only ' + error.F7 + ' tickets left. ';
                        }
                        if (ticketError.F9) {
                            errorMessage += 'For the Friday show at 9:00, there are only ' + error.F9 + ' tickets left. ';
                        }
                        if (ticketError.S7) {
                            errorMessage += 'For the Saturday show at 7:00, there are only ' + error.S7 + ' tickets left. ';
                        }
                        if (ticketError.S9) {
                            errorMessage += 'For the Saturday show at 9:00, there are only ' + error.S9 + ' tickets left.';
                        }
                        $('#errorMessage').text(errorMessage).show();
                        $('#submitData').click(validateAndSubmitData);
                        $('#checkoutText').text('Checkout');
                        $('#pageLoad').hide();
                    } else if (error.unfinishedPurchase) {
                        var purchaseRecord = error.unfinishedPurchase;
                        var unfinishedTickets = purchaseRecord.tickets;
                        var confirmText = 'You have an unfinished order in our system for: ';
                        if (unfinishedTickets.F7) {
                            confirmText += unfinishedTickets.F7 + ' tickets for Friday at 7. ';
                        }
                        if (unfinishedTickets.F9) {
                            confirmText += unfinishedTickets.F9 + ' tickets for Friday at 9. ';
                        }
                        if (unfinishedTickets.S7) {
                            confirmText += unfinishedTickets.S7 + ' tickets for Saturday at 7. ';
                        }
                        if (unfinishedTickets.S9) {
                            confirmText += unfinishedTickets.S9 + ' tickets for Saturday at 9. ';
                        }
                        confirmText += 'By clicking "OK", you will delete this order. Are you sure you want to continue?';
                        var confirmDelete = confirm(confirmText);
                        if (confirmDelete) {//go ahead and delete that record
                            console.log(purchaseRecord);
                            $.post('/checkout/record/delete', {id: purchaseRecord._id, email: purchaseRecord.email})
                                .done(function(message) {
                                    console.log(message);
                                    if (message == 'success') {
                                        validateAndSubmitData();
                                    } else {
                                        alert('uh oh, something went wrong. Please reload this page and try again');
                                    }
                                });
                        } else {//add some metadata to that record so we know to follow up
                            var areYouSureText = 'If you are sure you did complete the previous order, ' +
                                'please send an email of your receipt to divinecomedy.byu@gmail.com. '+
                                    'Otherwise, your order will be deleted.';
                            alert(areYouSureText);
                            window.open("http://www.byudivinecomedy.com","_self");
                            //$.post('/checkout/record/contested_record', {id: purchaseRecord._id})
                            //    .done(function(message) {
                            //        console.log(message);
                            //        if (message == 'success') {
                            //            validateAndSubmitData();
                            //        } else {
                            //            alert('uh oh, something went wrong. Please reload this page and try again');
                            //        }
                            //    });
                        }
                    }
                } else {
                    formatAndSubmitForm(ticketTotals);
                }
            });
    };

    $('.ticketInput').change(function() {
        calculateTotal();
    });

    $('#submitData').click(validateAndSubmitData);

});