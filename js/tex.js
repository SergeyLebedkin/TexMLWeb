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
        console.log(v.firstName);
        console.log(v.secondName);
    });
}