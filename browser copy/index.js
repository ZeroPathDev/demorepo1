function executeUserScript() {
    var userScript = document.getElementById('userScript').value;
    // Using eval to execute user-provided script
    eval(userScript);
}
