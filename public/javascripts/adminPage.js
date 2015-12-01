$(function() {
    var user = {username: 'byudc', password: 'getitgetit'};
    var refreshTicketCounts = function() {
        $.get('/ticketapi/get', function (data) {
            $('#friday7tickets').text('Friday @ 7:00--  ' + data.F7);
            $('#friday9tickets').text('Friday @ 9:00--  ' + data.F9);
            $('#saturday7tickets').text('Saturday @ 7:00--  ' + data.S7);
            $('#saturday9tickets').text('Saturday @ 9:00--  ' + data.S9);
        });
    }

    var resetInputFields = function() {
        $('#F7Change').val('');
        $('#F9Change').val('');
        $('#S7Change').val('');
        $('#S9Change').val('');
    }
    refreshTicketCounts();

    var normalizeTicketNumber = function(ticketAmount) {
        return parseInt(ticketAmount) ? parseInt(ticketAmount) : 0;
    };

    $('#setTickets').click(function(e) {
        $('#errorMessage').text('');
        var f7 = normalizeTicketNumber($('#F7Change').val());
        var f9 = normalizeTicketNumber($('#F9Change').val());
        var s7 = normalizeTicketNumber($('#S7Change').val());
        var s9 = normalizeTicketNumber($('#S9Change').val());
        var setObject = {F7: f7, F9: f9, S7: s7, S9: s9};
        var confirmText = 'Are you sure you want to set the ticket counts to: ' +
                f7 + ', ' + f9 + ', ' + s7 + ', ' + s9 + '?';
        var willContinue = confirm(confirmText);
        if (willContinue) {
            $.post('/admin/ticketapi/presidencyactions/set', setObject)
                .done(function (message) {
                    console.log('Setting');
                    console.log(message);
                    if (message !== 'success') {
                        $('#errorMessage').text(message);
                    } else {
                        refreshTicketCounts();
                        resetInputFields();
                    }
                });
        } else {
            resetInputFields();
        }
    });

    $('#updateTickets').click(function(e) {
        $('#errorMessage').text('');
        var updateObject = {};
        var confirmText = 'Are you sure you want to update the ticket counts by: ';
        if (normalizeTicketNumber($('#F7Change').val())) {
            updateObject.F7 = normalizeTicketNumber($('#F7Change').val());
            confirmText += updateObject.F7 + ' ticket(s) for Friday at 7, ';
        }
        if (normalizeTicketNumber($('#F9Change').val())) {
            updateObject.F9 = normalizeTicketNumber($('#F9Change').val());
            confirmText += updateObject.F9 + ' ticket(s) for Friday at 9, ';
        }
        if (normalizeTicketNumber($('#S7Change').val())) {
            updateObject.S7 = normalizeTicketNumber($('#S7Change').val());
            confirmText += updateObject.S7 + ' ticket(s) for Saturday at 7, ';
        }
        if (normalizeTicketNumber($('#S9Change').val())) {
            updateObject.S9 = normalizeTicketNumber($('#S9Change').val());
            confirmText += updateObject.S9 + ' ticket(s) for Saturday at 9';
        }
        confirmText += '?';

        if (Object.keys(updateObject).length) {
            var willContinue = confirm(confirmText);
            if (willContinue) {
                $.post('/admin/ticketapi/presidencyactions/update', updateObject)
                    .done(function (message) {
                        console.log('Updating');
                        console.log(message);
                        if (message !== 'success') {
                            $('#errorMessage').text(message);
                        } else {
                            refreshTicketCounts();
                            resetInputFields();
                        }
                    });
            } else {
                resetInputFields();
            }
        }
    });



});