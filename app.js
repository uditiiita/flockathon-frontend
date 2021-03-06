function documentReady() {
    var namespaceID = "flockster-";
    var host = "172.16.44.96:5000";

    function log(msg) {
        console.log(msg);
    }

    function loge(msg) {
        log(msg);
    }

    function logi(msg) {
        log(msg);
    }

    function newDivWithID(id) {
        return $("<div>").attr("id", id);
    }

    function newDivWithClass(divClass) {
        return $("<div>").addClass(divClass);
    }

    function showStartChatButton(id) {
        var plusDiv = newDivWithID(id);
        $("body").append(plusDiv);
    }

    function configureChatPopUpHeader(chatPopUpID, chatPopUpHeader) {
        var headerLabel = newDivWithClass(namespaceID + "header-label" ).text("Flocklets");
        var connectionStatusLabel = newDivWithClass(namespaceID + "connection-status-label").text("Connecting...");
        var favicon = newDivWithClass(namespaceID + "favicon");
        var closeButton = $("<button>").addClass(namespaceID + "close-button").html("&mdash;");
        chatPopUpHeader.append(favicon, closeButton, headerLabel, connectionStatusLabel);
        chatPopUpHeader.on("click", function() {
            logi("clicked header");
            toggleChat(chatPopUpID);
            closeButton.toggleClass("minimized");
        });
    }

    function toggleChat(chatPopUpID) {
        var headerSelector = "#" + chatPopUpID + " .flockster-header";
        var contentSelector = "#" + chatPopUpID + " .flockster-content";
        var footerSelector = "#" + chatPopUpID + " .flockster-footer";

        logi(contentSelector);
        $(headerSelector).toggleClass("minimized");
        $(headerSelector).toggleClass("minimized-additions");
        $(headerSelector).removeClass("should-blink");
        $(contentSelector).toggleClass("minimized");
        $(footerSelector).toggleClass("minimized");
        scrollMessagesToBottom(chatPopUpID);
    }

    function configureChatPopUpFooter(chatPopUpID, chatPopUpFooter) {
        var inputTextArea = $("<textarea>").addClass(namespaceID + "text-input").attr("placeholder", "Enter your message here.");
        var sendButton = $("<button>").addClass(namespaceID + "send-button").text("Send");
        sendButton.on("click", function() {
            sendMessageClicked(chatPopUpID);
        });
        chatPopUpFooter.append(inputTextArea, sendButton);
    }

    function showChatPopUp(chatPopUpID) {
        $("#flockster-start-chat").toggleClass("disable");
        logi("start chat with popup ID: " + chatPopUpID);
        var chatPopUp = newDivWithID(chatPopUpID);

        var chatPopUpHeader = newDivWithClass(namespaceID + "header");
        var chatPopUpContent = newDivWithClass(namespaceID + "content");
        var chatPopUpFooter = newDivWithClass(namespaceID + "footer");
        configureChatPopUpHeader(chatPopUpID, chatPopUpHeader);
        configureChatPopUpFooter(chatPopUpID, chatPopUpFooter);

        chatPopUp.append(chatPopUpHeader, chatPopUpContent, chatPopUpFooter);

        $("body").append(chatPopUp);
        setSendMessageOnPressingEnter(chatPopUpID);
        showNotConnected();
    }

    var ws = null;
    var token = null;

    function newToken() {
        return "user" + Math.floor((Math.random() * 1000) + 1);
    }

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }

    function assignToken() {
        logi("Assigning token");
        token = getCookie("token");
        if (token == "") {
            token = newToken();
            setCookie("token", token, 365);
        }
        logi("Token assigned: " + token);
    }

    function initWebSocket() {
        var scheme   = "ws://";
        var uri      = scheme + host + "/";
        return new WebSocket(uri);
    }

    function startChat(chatPopUpID) {
        assignToken();
        logi("Initializing web socket");
        ws = initWebSocket();
        showStatus(chatPopUpID, "Connecting...");
        ws.onopen = function() {
            showConnected();
            logi("Websocket opened");
            sendToken(chatPopUpID);
        };

        ws.onclose = function(event) {
            loge("Closed");
            log(event);
            showNotConnected();
            ws = null;
        };

        ws.onerror = function() {
            loge("Error occured");
            showNotConnected();
            ws = null;
        };

        ws.onabort = function() {
            loge("Abort occured");
            showNotConnected();
            ws = null;
        };

        ws.onmessage = function(message) {
            var data = JSON.parse(message.data);
            if(data.hasOwnProperty("support-name")){
                configReceived(chatPopUpID, data);
                return;
            }

            logi("Parsed message received: ");
            logi(data);
            receivedMessage(chatPopUpID, data);
        };
    }

    function showStatus(chatPopUpID, status) {
        var selector = "#" + chatPopUpID + " .flockster-header .flockster-connection-status-label";
        $(selector).text(status);
    }

    function configReceived(chatPopUpID, config) {
        logi("Config received");
        log(config);
        showSupportName(chatPopUpID, config["support-name"]);
        showWelcomeMessage(chatPopUpID, config["welcome-message"]);
    }

    function showSupportName(chatPopUpID, supportName) {
        var selector = "#" + chatPopUpID + " .flockster-header .flockster-header-label";
        $(selector).text(supportName);
    }

    function sendToken(chatPopUpID) {
        logi("Sending token: " + token);
        writeToWebSocket({handle: token});
    }

    function showWelcomeMessage(chatPopUpID, welcomMessage) {
        var contentSelector = "#" + chatPopUpID + " .flockster-content";

        if($(contentSelector).find('.welcome-message').length == 0) {
            $(contentSelector).append(
                "<div class='welcome-message'>"+welcomMessage+"</div>");
        }
    }


    function showMessageOnScreen(chatPopUpID, message, direction) {
        logi("Showing message on screen, direction: " + direction);
        logi(message);

        var label = message.handle;
        var text = message.text;

        if(label == token) {
            label = "You";
        }

        var directionClass = "outgoing";
        if(direction === "incoming") {
            directionClass = "incoming";
        }
        var contentSelector = "#" + chatPopUpID + " .flockster-content";
        $(contentSelector).append(
            "<div class='message " + directionClass +"'><span class='text'>" + text + "</span></div>");
        scrollMessagesToBottom(chatPopUpID);

    }
    function scrollMessagesToBottom(chatPopUpID) {
        var contentSelector = "#" + chatPopUpID + " .flockster-content";
        $(contentSelector).stop().animate({
            scrollTop: $(contentSelector)[0].scrollHeight
        }, 800);
    }

    function receivedMessage(chatPopUpID, message) {
        $("#"+chatPopUpID+" .flockster-header.minimized").addClass("should-blink");
        showMessageOnScreen(chatPopUpID, message, "incoming");
    }

    function sendMessageClicked(chatPopUpID) {
        var textArea = $("#" + chatPopUpID + " .flockster-footer .flockster-text-input");
        var text = textArea.val().trim();
        if(text == "") {
            return;
        }
        logi(text);
        sendMessage(chatPopUpID, text)
        textArea.val("");
    }

    function sendMessage(chatPopUpID, text) {
        var message = { handle: token, text: text };
        logi("Sending message: ");
        logi(message);
        writeToWebSocket(message);
        showMessageOnScreen(chatPopUpID, message, "outgoing");
    }

    function writeToWebSocket(JSONData) {
        if(ws == null || token == null) {
            //TODO: may be show some warning or error
            loge("Could not write. Websocket or token invalid");
            return;
        }
        JSONData.uuid = flocksterID;
        ws.send(JSON.stringify(JSONData));
        logi("Written to websocket: ");
        logi(JSONData);
    }

    function setSendMessageOnPressingEnter(chatPopUpID) {
        logi($(".flockster-footer textarea"));
        $(".flockster-footer textarea").keyup(function(event) {
            logi(event.keyCode);
            if(event.keyCode == 13 && !event.altKey && !event.shiftKey) {
                if ($("#" + chatPopUpID + " .flockster-send-button").prop("disabled")) {
                    logi("Sending disabled. So ignoring enter.");
                    return;
                }
                sendMessageClicked(chatPopUpID);
            }
        });
    }

    var startChatButtonID = namespaceID + "start-chat";
    showStartChatButton(startChatButtonID);

    var chatPopUpID = namespaceID + "chat-pop-up";
    $("#" + startChatButtonID).on("click", function() {
        showChatPopUp(chatPopUpID);
        startChat(chatPopUpID);
    });

    function timeoutBlink() {
        $(".flockster-header.minimized.should-blink").toggleClass("blink");
        setTimeout(function(){
            timeoutBlink();
        }, 500);
    }
    timeoutBlink();

    function monitorConnection() {
        logi("Checking network status");
        var randomValue = Math.floor((1 + Math.random()) * 0x10000)

        $.ajax({
            type: "HEAD",
            url: document.location.pathname+"?rand=" + randomValue,
            contentType: "application/json",
            error: function(response) {
                if(response.status != 0) {
                    logi("Network disconnected.");
                }
            },
            success: function() {
                logi("Network connected.");
            },
            complete: function(jqXHR, textStatus) {
                console.log(textStatus);

                if(textStatus == "error") {
                    disconnectWebSocket();
                } else {
                    reconnectWebSocket();
                }
            }
        });

        setTimeout(monitorConnection, 5000);
    }

    monitorConnection();

    function disconnectWebSocket() {
        log(ws);
        if(ws != null) {
            log(ws.readyState);
        }
        var shouldDisconnect = ws != null && (ws.readyState == WebSocket.OPEN || ws.readyState == WebSocket.CONNECTING);
        logi("Should disconnect: " + shouldDisconnect);

        if(shouldDisconnect) {
            logi("Closing web socket");
            ws.close();
            showNotConnected();
            ws=null;
        }
    }

    function reconnectWebSocket() {
        log(ws);
        if(ws != null) {
            log(ws.readyState);
        }

        var shouldReconnect = ws == null || (ws.readyState == WebSocket.CLOSED || ws.readyState == WebSocket.CLOSING );
        logi("Should reconnect: " + shouldReconnect);
        if(shouldReconnect) {
            logi("Reconnecting web socket");
            startChat(chatPopUpID);
        }
    }

    function showConnected() {
        showStatus(chatPopUpID, "Connected.");
        enableSendButton(true);
    }

    function showNotConnected() {
        showStatus(chatPopUpID, "Not Connected.");
        enableSendButton(false);
    }

    function enableSendButton(shouldEnable) {
        var selector = "#" + chatPopUpID + " .flockster-send-button";
        $(selector).prop("disabled", !shouldEnable);
    }
}

$(document).ready(function () {
    documentReady();
});