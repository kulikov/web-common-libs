define({
    load: function (name, req, load, config) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = config.baseUrl + (config.paths[name] || name) + '.css';
        document.getElementsByTagName("head")[0].appendChild(link);
        load(null);
    }
});
