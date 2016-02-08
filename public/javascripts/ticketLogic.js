$(function() {

    $.get('/ticketapi/get', function(data) {
        if (data.F7 <= 0) {
            $('#F7ticketsAmount').prop('disabled', true);
            $('#F7ticketsTitle').addClass('disabled');
        }
        if (data.F9 <= 0) {
            $('#F9ticketsAmount').prop('disabled', true);
            $('#F9ticketsTitle').addClass('disabled');
        }
        if (data.S7 <= 0) {
            $('#S7ticketsAmount').prop('disabled', true);
            $('#S7ticketsTitle').addClass('disabled');
        }
        if (data.S9 <= 0) {
            $('#S9ticketsAmount').prop('disabled', true);
            $('#S9ticketsTitle').addClass('disabled');
        }
        if (data.T1 <= 0) {
            $('#T1ticketsAmount').prop('disabled', true);
            $('#T1ticketsTitle').addClass('disabled');
        }
        if (data.T2 <= 0) {
            $('#T2ticketsAmount').prop('disabled', true);
            $('#T2ticketsTitle').addClass('disabled');
        }
        if (data.T3 <= 0) {
            $('#T3ticketsAmount').prop('disabled', true);
            $('#T3ticketsTitle').addClass('disabled');
        }
        if (data.T4 <= 0) {
            $('#T4ticketsAmount').prop('disabled', true);
            $('#T4ticketsTitle').addClass('disabled');
        }
    });

    var normalizeTicketNumber = function(ticketAmount) {
        return parseInt(ticketAmount) ? parseInt(ticketAmount) : 0;
    };

    var calculateTotal = function() {
        var f7 = normalizeTicketNumber($('#F7ticketsAmount').val());
        var f9 = normalizeTicketNumber($('#F9ticketsAmount').val());
        var s7 = normalizeTicketNumber($('#S7ticketsAmount').val());
        var s9 = normalizeTicketNumber($('#S9ticketsAmount').val());
        var t1 = normalizeTicketNumber($('#T1ticketsAmount').val());
        var t2 = normalizeTicketNumber($('#T2ticketsAmount').val());
        var t3 = normalizeTicketNumber($('#T3ticketsAmount').val());
        var t4 = normalizeTicketNumber($('#T4ticketsAmount').val());
        var numberOfTickets = f7 + f9 + s7 + s9 + t1 + t2 + t3 + t4;
        var total = numberOfTickets * 5;
        $('#cost').text('Total: $'+total+'.00');
        $('#totalCost').val(''+total+'.00');
        $('#quantity').val(numberOfTickets);
        return {F7: f7, F9: f9, S7: s7, S9: s9, T1: t1, T2: t2, T3: t3, T4: t4};
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
        if (!parseInt($('#F7ticketsAmount').val()) &&
            !parseInt($('#F9ticketsAmount').val()) &&
            !parseInt($('#S7ticketsAmount').val()) &&
            !parseInt($('#S9ticketsAmount').val()) &&
            !parseInt($('#T1ticketsAmount').val()) &&
            !parseInt($('#T2ticketsAmount').val()) &&
            !parseInt($('#T3ticketsAmount').val()) &&
            !parseInt($('#T4ticketsAmount').val())) {
            $('#errorMessage').text('You can\'t check out when you haven\'t selected any tickets!').show();
            ready = false;
        }
        return ready;
    };

    var formatAndSubmitForm = function(ticketCounts) {
        var itemNumber = 1;
        for (show in ticketCounts) {
            if (ticketCounts[show] > 0) {
                $('#hiddenForm').append('<input type="hidden" name="itemcode'+itemNumber+'" value="WEBDC-'+show+'">');
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
                F7Tickets: normalizeTicketNumber($('#F7ticketsAmount').val()),
                F9Tickets: normalizeTicketNumber($('#F9ticketsAmount').val()),
                S7Tickets: normalizeTicketNumber($('#S7ticketsAmount').val()),
                S9Tickets: normalizeTicketNumber($('#S9ticketsAmount').val()),
                T1Tickets: normalizeTicketNumber($('#T1ticketsAmount').val()),
                T2Tickets: normalizeTicketNumber($('#T2ticketsAmount').val()),
                T3Tickets: normalizeTicketNumber($('#T3ticketsAmount').val()),
                T4Tickets: normalizeTicketNumber($('#T4ticketsAmount').val())
            }
            )
            .done(function(response) {
                if (response.error) {
                    var error = response.error;
                    if (error.email) {
			var errorMessage = 'Sorry, you provided an invalid email address. Please check your email and try again.';
			$('#errorMessage').text(errorMessage).show();
		    } else if (error.tickets) {
                        var ticketError = error.tickets;
                        var errorMessage = 'Regrettably, there are not enough tickets to fulfill your request. '
                        if (ticketError.F7) {
                            errorMessage += 'For the Friday show at 7:00, there are only ' + ticketError.F7 + ' tickets left. ';
                        }
                        if (ticketError.F9) {
                            errorMessage += 'For the Friday show at 9:00, there are only ' + ticketError.F9 + ' tickets left. ';
                        }
                        if (ticketError.S7) {
                            errorMessage += 'For the Saturday show at 7:00, there are only ' + ticketError.S7 + ' tickets left. ';
                        }
                        if (ticketError.S9) {
                            errorMessage += 'For the Saturday show at 9:00, there are only ' + ticketError.S9 + ' tickets left.';
                        }
                        if (ticketError.T1) {

                        }
                        if (ticketError.T2) {

                        }
                        if (ticketError.T3) {

                        }
                        if (ticketError.T4) {

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
                        if (unfinishedTickets.T1) {

                        }
                        if (unfinishedTickets.T2) {

                        }
                        if (unfinishedTickets.T3) {

                        }
                        if (unfinishedTickets.T4) {

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
