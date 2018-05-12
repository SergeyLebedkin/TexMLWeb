function loadPage() {
    // create array of settings
    var settings = [
        new TMLSettings(),
        new TMLSettings(),
        new TMLSettings(),
        new TMLSettings()
    ];
    // iterrate by array
    settings.forEach(v => {
        // get main div element
        var elem = document.getElementById("main_text");

        // append new elements (first name)
        var p = document.createElement("p");
        p.innerText = v.firstName;
        p. className = "name_style";
        elem.appendChild(p);

        // append new elements (second name)
        var p = document.createElement("p");
        p.innerText = v.secondName;
        p. className = "name_style";
        elem.appendChild(p);
    });
}