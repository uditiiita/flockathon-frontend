
//ws.onmessage = function(message) {
//    var data = JSON.parse(message.data);
//    $("#chat-text").append("<div class='panel panel-default'><div class='panel-heading'>" + data.handle + "</div><div class='panel-body'>" + data.text + "</div></div>");
//    $("#chat-text").stop().animate({
//        scrollTop: $('#chat-text')[0].scrollHeight
//    }, 800);
//};
//
//$("#input-form").on("submit", function(event) {
//    event.preventDefault();
//    var handle = $("#input-handle")[0].value;
//    var text   = $("#input-text")[0].value;
//    ws.send(JSON.stringify({ handle: handle, text: text }));
//    $("#input-text")[0].value = "";
//});

$(document).ready(function() {
    var namespaceID = "flockster-";

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
        var plusDiv = newDivWithID(id).html("+");
        $("body").append(plusDiv);
    }
    
    function configureChatPopUpHeader(chatPopUpHeader) {
        var closeButton = $("<button>").addClass(namespaceID + "close-button").text("X");
        chatPopUpHeader.append(closeButton);
    }

    function configureChatPopUpFooter(chatPopUpID, chatPopUpFooter) {
        var inputTextArea = $("<textarea>").addClass(namespaceID + "text-input");
        var sendButton = $("<button>").addClass(namespaceID + "send-button").text("Send");
        sendButton.on("click", function() {
            sendMessageClicked(chatPopUpID);
        });
        chatPopUpFooter.append(inputTextArea, sendButton);
    }

    function showChatPopUp(chatPopUpID) {
        logi("start chat with popup ID: " + chatPopUpID);
        var chatPopUp = newDivWithID(chatPopUpID);

        var chatPopUpHeader = newDivWithClass(namespaceID + "header");
        var chatPopUpContent = newDivWithClass(namespaceID + "content");
        var chatPopUpFooter = newDivWithClass(namespaceID + "footer");
        configureChatPopUpHeader(chatPopUpHeader);
        configureChatPopUpFooter(chatPopUpID, chatPopUpFooter);
        
        chatPopUp.append(chatPopUpHeader, chatPopUpContent, chatPopUpFooter);

        $("body").append(chatPopUp);
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
        var uri      = scheme + "172.16.44.96:5000" + "/";
        return new WebSocket(uri);
    }

    function startChat(chatPopUpID) {
        assignToken();
        logi("Initializing web socket");
        ws = initWebSocket();
        ws.onopen = function() {
            logi("Websocket opened");
            sendToken(chatPopUpID);
        };

        ws.onmessage = function(message) {
            logi("Message received: " + message);
            var data = JSON.parse(message.data);
            logi("Parsed message received: " + data);
            receivedMessage(chatPopUpID, data);
        };
    }

    function sendToken(chatPopUpID) {
        logi("Sending token: " + token);
        writeToWebSocket(chatPopUpID, {token: token});
    }


    function showMessageOnScreen(chatPopUpID, message) {
        logi("Showing message on screen");
        logi(message);
        $("#" + chatPopUpID + " .flockster-content").append(
            "<div class='message'><span class='label'>" + message.token + ": </span><span class='text'>" + message.text + "</span></div>");
        //$("#chat-text").stop().animate({
        //    scrollTop: $('#chat-text')[0].scrollHeight
        //}, 800);
    }

    function receivedMessage(chatPopUpID, message) {
        showMessageOnScreen(chatPopUpID, message);
    }

    function sendMessageClicked(chatPopUpID) {
        var textArea = $("#" + chatPopUpID + " .flockster-footer .flockster-text-input");
        var text = textArea.val();
        logi(text);
        sendMessage(chatPopUpID, text)
    }

    function sendMessage(chatPopUpID, text) {
        logi("Sending message: " + text);
        var message = { token: token, text: text };
        writeToWebSocket(message);
        showMessageOnScreen(chatPopUpID, message);
    }

    function writeToWebSocket(chatPopUpID, JSONData) {
        if(ws == null || token == null) {
            //TODO: may be show some warning or error
            loge("Could not write. Websocket or token invalid");
            return;
        }
        ws.send(JSON.stringify(JSONData));
        logi("Written to websocket: ");
        logi(JSONData);
        showMessageOnScreen(chatPopUpID, JSONData);
    }

    var startChatButtonID = namespaceID + "start-chat";
    showStartChatButton(startChatButtonID);

    $("#" + startChatButtonID).on("click", function() {
        var chatPopUpID = namespaceID + "chat-pop-up";
        showChatPopUp(chatPopUpID);
        startChat(chatPopUpID);
    });
});