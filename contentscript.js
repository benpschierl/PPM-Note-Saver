// 
// var s = document.createElement('script');
// s.src = chrome.extension.getURL('script.js');
// (document.head||document.documentElement).appendChild(s);
// s.onload = function() {
//     s.parentNode.removeChild(s);
// };

function injectScript(source) {

    var elem = document.createElement("script"); //Create a new script element
    elem.type = "text/javascript"; //It's javascript
    elem.innerHTML = source; //Assign the source
    document.documentElement.appendChild(elem); //Inject it into the DOM
}

// This is the note saver
injectScript("("+(function() {

    window.checkTimecodes = function checkTimecodes() {    
        console.debug('Checking time codes');
        projectRows = $('tr[data-ppm_odf_pk]:not(.subTotal):not(.total)');

        if (projectRows) {
            for (var i = 0, len = projectRows.length; i < len; i++) {
                // Description appears to always be in column 9 (?)
                rowDescription = $(projectRows[i]).find("td[column='9']")[0];

                if (rowDescription) {
                    timeCodeMatch = rowDescription.innerText.match("^(\\d\\d|PR)\\s");
                    if (timeCodeMatch && timeCodeMatch.length > 1) {
                        timeCode = timeCodeMatch[1];

                        timeCodeCombobox = $(projectRows[i]).find("select[name='timeentry_tc']")[0];
                        if (timeCodeCombobox) {
                            timeCodeBoxValue = timeCodeCombobox.options[timeCodeCombobox.selectedIndex].text;

                            if (!timeCodeBoxValue.startsWith(timeCode)) {
                                alert("Wrong timecode: " + timeCodeBoxValue.toString());
                            }
                        }
                    }
                }
            }
        }
    }

    function bindResponse(request, response) {
        request.__defineGetter__("responseText", function() {
            //console.warn('Something tried to get the responseText');
            //console.debug(response);
            //console.debug('Request url: ' + request.responseURL);
            if (request.responseURL && request.responseURL.indexOf('action=timeadmin.notesBrowser') >= 0) {
                console.debug('Adding override for note editor "Return" button');
                response = response.replace('onClick="closeWindow();"',
                    'onClick=\'if ($(\"textarea.ppm_field\")[0].value > \"\") { ' +
                    '$("#portlet-timeadmin\\\\.notesBrowser button:contains(\\x27Add\\x27)")' +
                    '.attr("style","background: linear-gradient(#aa0000,#ff0000); border: 1px solid red;")' +
                    '} else { closeWindow(); }\'');
            }

            if (request.responseURL && (request.responseURL.indexOf('action=timeadmin.editTimesheet') >= 0 ||
                request.responseURL.indexOf('action=timeadmin.saveTimesheetGet') >= 0) {
                console.debug('Adding override for timesheet editor "Save" button');
                response = response.replace('submitForm(\'page\',\'timeadmin.saveTimesheet\');',
                    'if (checkTimecodes()) { submitForm(\'page\',\'timeadmin.saveTimesheet\'); }');
            }

            return response;
        })
    }

    function processResponse(request,caller,method,path) {
        bindResponse(request, request.responseText);
    }

    var proxied = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, path, async) {
            var caller = arguments.callee.caller;
            this.addEventListener('readystatechange', function() {
                if (this.readyState === 4)
                    processResponse(this,caller,method,path);
            }, true);
        return proxied.apply(this, [].slice.call(arguments));
    };
}).toString()+")()");
