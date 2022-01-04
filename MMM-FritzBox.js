/*
* Magic Mirror Module: FRITZ   
* Displaying stats of your Fritzbox and your SmartHomeModules
* By Christian Junge
*/

Module.register("MMM-FritzBox", {
	defaults: {
		header: "Frizbox-Status:",
		maxWidth: "250px",
	},
	start: function() {
		Log.info("Starting module: " + this.name);
		setInterval(() => {
			this.updateDom(1000);
		}, 1000);
	},
	getDom: function() {
		const  wrapper = document.createElement("div");
		wrapper.className = "thin xlarge bright pre-line";
		const text = document.createElement("span");
		text.appendChild(document.createTextNode("Status Fritzbox"));
		wrapper.appendChild(text);
		return wrapper;	
	},
});
