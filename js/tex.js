function loadPage() {
    var settings = [new TMLSettings(), new TMLSettings(), new TMLSettings(), new TMLSettings()];
    settings.forEach(v => {
        console.log(v.firstName);
        console.log(v.secondName);
    });
    console.log("loadPage runned");
}