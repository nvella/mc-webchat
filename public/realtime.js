var socket = io();

socket.on('chat', function(line) {
    // Append new chat line
    document.getElementById('chat').innerHTML += '<tr><td class="timestamp">' + line[0] + '</td><td class="chatline">' + line[1] + '</td></tr>';
    // Scroll to bottom
    window.scrollTo(0,document.body.scrollHeight);
});