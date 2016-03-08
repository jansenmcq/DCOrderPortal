$(function() {
    var refreshTicketCounts = function() {
        $.get('/ticketapi/get', function (data) {
            if ($('#F7TicketsLeft').length) {
                $('#F7TicketsLeft .ticketAmount').text(data.F7);
            }
            if ($('#F9TicketsLeft').length) {
                $('#F9TicketsLeft .ticketAmount').text(data.F9);
            }
            if ($('#S7TicketsLeft').length) {
                $('#S7TicketsLeft .ticketAmount').text(data.S7);
            }
            if ($('#S9TicketsLeft').length) {
                $('#S9TicketsLeft .ticketAmount').text(data.S9);
            }
            if ($('#T1TicketsLeft').length) {
                $('#T1TicketsLeft .ticketAmount').text(data.T1);
            }
            if ($('#T2TicketsLeft').length) {
                $('#T2TicketsLeft .ticketAmount').text(data.T2);
            }
            if ($('#T3TicketsLeft').length) {
                $('#T3TicketsLeft .ticketAmount').text(data.T3);
            }
            if ($('#T4TicketsLeft').length) {
                $('#T4TicketsLeft .ticketAmount').text(data.T4);
            }
        });
    };

    var resetTicketInputFields = function() {
        $('#F7Change').val('');
        $('#F9Change').val('');
        $('#S7Change').val('');
        $('#S9Change').val('');
        $('#T1Change').val('');
        $('#T2Change').val('');
        $('#T3Change').val('');
        $('#T4Change').val('');
    };
    refreshTicketCounts();

    var normalizeTicketNumber = function(ticketAmount) {
        return parseInt(ticketAmount) ? parseInt(ticketAmount) : 0;
    };

    $('#setTickets').click(function(e) {
        $('#errorMessage').text('');
        var enabledShows = {};
        var confirmText = 'Are you sure you want to set the ticket counts to: ';
        if ($('#F7Change').length) {
            enabledShows.F7 = normalizeTicketNumber($('#F7Change').val());
        }
        if ($('#F9Change').length) {
            enabledShows.F9 = normalizeTicketNumber($('#F9Change').val());
        }
        if ($('#S7Change').length) {
            enabledShows.S7 = normalizeTicketNumber($('#S7Change').val());
        }
        if ($('#S9Change').length) {
            enabledShows.S9 = normalizeTicketNumber($('#S9Change').val());
        }
        if ($('#T1Change').length) {
            enabledShows.T1 = normalizeTicketNumber($('#T1Change').val());
        }
        if ($('#T2Change').length) {
            enabledShows.T2 = normalizeTicketNumber($('#T2Change').val());
        }
        if ($('#T3Change').length) {
            enabledShows.T3 = normalizeTicketNumber($('#T3Change').val());
        }
        if ($('#T4Change').length) {
            enabledShows.T4 = normalizeTicketNumber($('#T4Change').val());
        }
        for (show in enabledShows) {
            console.log('Show:', show, 'number:', enabledShows[show]);
            confirmText += enabledShows[show] + ', ';
        }
        confirmText = confirmText.substr(0, confirmText.length - 2) + '?';

        var willContinue = confirm(confirmText);
        if (willContinue) {
            $.post('/admin/ticketapi/presidencyactions/set', enabledShows)
                .done(function (message) {
                    console.log('Setting');
                    console.log(message);
                    if (message !== 'success') {
                        $('#errorMessage').text(message);
                    } else {
                        refreshTicketCounts();
                        resetTicketInputFields();
                    }
                });
        } else {
            resetTicketInputFields();
        }
    });

    $('#updateTickets').click(function(e) {
        $('#errorMessage').text('');
        var updateObject = {};
        var confirmText = 'Are you sure you want to update the ticket counts by: ';
        if (normalizeTicketNumber($('#F7Change').val())) {
            updateObject.F7 = normalizeTicketNumber($('#F7Change').val());
            confirmText += updateObject.F7 + ' ticket(s) for ' + $('#F7Label').text() + ', ';
        }
        if (normalizeTicketNumber($('#F9Change').val())) {
            updateObject.F9 = normalizeTicketNumber($('#F9Change').val());
            confirmText += updateObject.F9 + ' ticket(s) for ' + $('#F9Label').text() + ', ';
        }
        if (normalizeTicketNumber($('#S7Change').val())) {
            updateObject.S7 = normalizeTicketNumber($('#S7Change').val());
            confirmText += updateObject.S7 + ' ticket(s) for ' + $('#S7Label').text() + ', ';
        }
        if (normalizeTicketNumber($('#S9Change').val())) {
            updateObject.S9 = normalizeTicketNumber($('#S9Change').val());
            confirmText += updateObject.S9 + ' ticket(s) for ' + $('#S9Label').text() + ', ';
        }
        if (normalizeTicketNumber($('#T1Change').val())) {
            updateObject.T1 = normalizeTicketNumber($('#T1Change').val());
            confirmText += updateObject.T1 + ' ticket(s) for ' + $('#T1Label').text() + ', ';
        }
        if (normalizeTicketNumber($('#T2Change').val())) {
            updateObject.T2 = normalizeTicketNumber($('#T2Change').val());
            confirmText += updateObject.T2 + ' ticket(s) for ' + $('#T2Label').text() + ', ';
        }
        if (normalizeTicketNumber($('#T3Change').val())) {
            updateObject.T3 = normalizeTicketNumber($('#T3Change').val());
            confirmText += updateObject.T3 + ' ticket(s) for ' + $('#T3Label').text() + ', ';
        }
        if (normalizeTicketNumber($('#T4Change').val())) {
            updateObject.T4 = normalizeTicketNumber($('#T4Change').val());
            confirmText += updateObject.T4 + ' ticket(s) for ' + $('#T4Label').text() + ', ';
        }
        confirmText = confirmText.substr(0, confirmText.length - 2) + '?';

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
                            resetTicketInputFields();
                        }
                    });
            } else {
                resetTicketInputFields();
            }
        }
    });

    $('#updateUsername').click(function(e) {
        if (!$('#usernameInput').val()){
            return;
        }
        $.post('/admin/accountsapi/presidencyactions/changeUsername', {username: $('#usernameInput').val()})
            .done(function(message) {
                if (message.newUsername) {
                    alert('Success! Your new username is: "' + message.newUsername + '". Don\'t forget it!');
                    $('#usernameInput').val('');
                } else {
                    alert('Something messed up. Check the console.');
                    console.log(message);
                }
            })
            .fail(function(error) {
                alert('Sorry, but there\'s been an error:', error, '\nPlease try again or ask Jansen for help');
            });
    });

    $('#updatePassword').click(function(e) {
        if (!$('#passwordInput').val()) {
            return;
        }
        $.post('/admin/accountsapi/presidencyactions/changePassword', {password: $('#passwordInput').val()})
            .done(function(message) {
                if (message.newPassword) {
                    alert('Success! Your new password is: "' + message.newPassword + '". Don\'t forget it!');
                    $('#passwordInput').val('');
                } else {
                    alert('Something messed up. Check the console.');
                    console.log(message);
                }
            })
            .fail(function(error) {
                alert('Sorry, but there\'s been an error:' + JSON.stringify(error) + '\nPlease try again or ask Jansen for help');
            });
    });

    $('#clearFailedPurchases').click(function(e) {
        $.post('/admin/recordsapi/presidencyactions/sanitizeDatabase')
            .done(function(message) {
                alert('Success! There have been ' + message.n + ' records deleted.');
                refreshTicketCounts();
            })
            .fail(function(error) {
                alert('Sorry, but there\'s been an internal error:', error, '\nPlease try again or ask Jansen for help');
            });
    });

    $('#saveShowInfoChanges').click(function(e) {
        var enableShow = {
            data:{
                sellingTickets: $('#showEnableInput').prop('checked'),
                enabledShows: {
                    F7enabled: $('#F7EnableInput').prop('checked'),
                    F9enabled: $('#F9EnableInput').prop('checked'),
                    S7enabled: $('#S7EnableInput').prop('checked'),
                    S9enabled: $('#S9EnableInput').prop('checked'),
                    T1enabled: $('#T1EnableInput').prop('checked'),
                    T2enabled: $('#T2EnableInput').prop('checked'),
                    T3enabled: $('#T3EnableInput').prop('checked'),
                    T4enabled: $('#T4EnableInput').prop('checked')
                }
            }
        };
        var showNames = {
            data: {
                F7Name: $('#F7ShowNameInput').val(),
                F9Name: $('#F9ShowNameInput').val(),
                S7Name: $('#S7ShowNameInput').val(),
                S9Name: $('#S9ShowNameInput').val(),
                T1Name: $('#T1ShowNameInput').val(),
                T2Name: $('#T2ShowNameInput').val(),
                T3Name: $('#T3ShowNameInput').val(),
                T4Name: $('#T4ShowNameInput').val()
            }
        };
        var showTimeText = {
            data: $('#showTimeTextInput').val()
        };
        var bannerText = {
            data: $('#bannerTextInput').val()
        };
        var postObject = {
            enableShow: enableShow,
            showNames: showNames,
            showTimeText: showTimeText,
            bannerText: bannerText
        };
        console.log(postObject);
        $.post('/admin/infoapi/presidencyactions/saveinfo', postObject)
            .done(function(updateMessage) {
                if (updateMessage == 'success') {
                    alert('Success!');
                } else {
                    alert('Something went wrong. Please refresh the page and try again.');
                }
            })
            .fail(function(err) {
                alert('Something went wrong: ' + JSON.stringify(err) +'.\nPlease refresh the page and try again.');
            });

    });

    $('#resetPurchases').click(function() {
        var reset = confirm('By clicking \'OK\' you will be deleting all previous purchase records. Are you sure you want to do this?');
        if (reset) {
            $.post('/admin/recordsapi/presidencyactions/reset')
                .done(function (message) {
                    alert('Success!');
                })
                .fail(function(error) {
                    alert('There seems to have been some kind of error:' + JSON.stringify(error) + 'Please try again or ask Jansen for help');
                });
        }
    });

});