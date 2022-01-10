
/*
* Magic Mirror Module: MMM-FritzBox
* Displaying stats of your Fritzbox and your SmartHomeModules
* By Christian Junge
*/

Module.register("MMM-FritzBox", {
	defaults: {
		header: "Fritzbox",
		maxWidth: "250px",
		updateConnectionStateInterval: 10000,
		updateSmartHomeStateInterval: 5000,
		initialUpdateInterval: 250,
		domUpdateInterval: 0,
		access: {
			username: "John Doe",
			password: "foobar",
			host: "192.168.178.1",
			port: "1234",
		},
		size: "xsmall",
		toggleOn: "toggle-on",
		toggleOff: "toggle-off",
		downStream: "download",
		upStream:"upload",
		connected: "signal",
		disconnected:"exclamation-circle", 
		registered: "bookmark",
		unknown: "question",
		ping: "clock",
	},
	initialized: false,
	connectionStateReceived: true,
	smartHomeStateReceived: true,
	connectionState: undefined,
	smartHomeState: undefined,
	bit2MBitRatio: 1048576,

	getStyles: function() {
		return ["font-awesome.css", "MMM-FritzBox.css"];
	},

	start: function() {
		console.log("Starting module: " + this.name);
		this.initNodeHelper();
	},

	initNodeHelper: function(){
		this.sendSocketNotification("INIT_FRITZBOX", this.config.access);
	},

        getElement: function(name) {
		return document.createElement(name);
	},

	getIcon: function(iconName, shouldHighlight) {
		const icon = this.getElement("span");
		icon.className=`fa fa-${iconName} symbol icon-default ${shouldHighlight ? 'highlight' : ''}`;
		return icon;
	},

	getConnectionIcon: function(value, shouldHighlight) {
		switch(value) {
			case "CONNECTED":
				return this.getIcon(this.config.connected, shouldHighlight);
			case "REGISTERED":
				return this.getIcon(this.config.registered, shouldHighlight);
			case "DISCONNECTED":
				return this.getIcon(this.config.disconnected, shouldHighlight);
			default:
				return this.getIcon(this.config.unknown, shouldHighlight);
		} 
	},

	getSpinner: function() {
		const spinner = this.getElement("i");
		spinner.className = "fas fa-circle-notch fa-spin";
		return spinner;
	},

	getFormattedStreamSpeed: function(value){
		return (value / this.bit2MBitRatio).toFixed(1);
	},

 	setConnectionContent: function(parent) {
		parent.appendChild(this.getIcon(this.config.downStream));
		const downStream = this.getElement("span");
		downStream.className = "entry";
		downStream.innerHTML = this.getFormattedStreamSpeed(this.connectionState.NewDownstreamMaxBitRate)   + " Mbit/s ";
		parent.appendChild(downStream);

		parent.appendChild(this.getIcon(this.config.upStream));
		const upStream = this.getElement("span");
		upStream.className = "entry";
		upStream.innerHTML = this.getFormattedStreamSpeed(this.connectionState.NewUpstreamMaxBitRate)   + " Mbit/s";
		parent.appendChild(upStream);

		parent.appendChild(this.getIcon(this.config.ping));
		const ping = this.getElement("span");
		ping.className = "entry";
		ping.innerHTML = (this.connectionState.NewUptime / 1000).toFixed(1) + "ms";
		parent.appendChild(ping);
	},
	setSmartHomeContent: function(parent) {
		this.smartHomeState.forEach(device => {
			const deviceType = parseInt(device.NewProductName.split(" ")?.[1]);
			if (300  >  deviceType &&  200 <= deviceType  ) {
				const deviceRow = this.getElement("tr");
				const isOn = device.NewSwitchState === "ON";

				const nameCell = this.getElement("th");
				nameCell.className = isOn ? "highlight table-header" : "table-header";
				nameCell.innerHTML = device.NewDeviceName;
				deviceRow.appendChild(nameCell);

				const stateCell  = this.getElement("td");
				stateCell.appendChild(isOn ? this.getIcon(this.config.toggleOn, isOn): this.getIcon(this.config.toggleOff, isOn));
				deviceRow.appendChild(stateCell);

				const connectionCell = this.getElement("td");
				connectionCell.appendChild(this.getConnectionIcon(device.NewPresent, isOn));
				deviceRow.appendChild(connectionCell);

				const consumptionCell = this.getElement("td")
                             	consumptionCell.innerHTML = (device.NewMultimeterPower/100).toFixed(1) + " W";
				consumptionCell.className = isOn ? "highlight" : "";
				deviceRow.appendChild(consumptionCell);

				parent.appendChild(deviceRow);
			}
		});
	},

	getDom: function() {
		const  wrapper = this.getElement("div");
		wrapper.className = `${this.config.size}`;
	        const titleSection = this.getElement("div");

	 	const subscription = this.getElement("span");
		subscription.innerHTML = "Fritz!Box:";
		subscription.className = "entry highlight";
		titleSection.appendChild(subscription);
		wrapper.appendChild(titleSection);

		if (!this.connectionState) {
		 	titleSection.appendChild(this.getSpinner());
		} else {
			 titleSection.className = "title-section"
			this.setConnectionContent(titleSection);
		}

		const smartHome = this.getElement("table");

		if (this.smartHomeState) {
			const smartHome = this.getElement("table");
		 	this.setSmartHomeContent(smartHome);
		 	wrapper.appendChild(smartHome);
		}
		return wrapper;
	},

	scheduleUpdate: function() {
	        setInterval(() => {
			if (this.connectionStateReceived) {
				this.connectionStateReceived = false;
				this.sendSocketNotification("GET_CONNECTION_STATE");
        		}
		}, this.config.updateConnectionStateInterval);
		setInterval(() => {
			if (this.smartHomeStateReceived) {
				this.smartHomeStateReceived = false;
				this.sendSocketNotification("GET_SMARTHOME_STATE");
			}
		}, this.config.updateSmartHomeStateInterval);
    	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "FRITZBOX_INITIALIZED" && payload ) {
			this.connectionState = payload.connectionState;
			this.connectionStateReceived = true;
			this.smartHomeState = payload.smartHomeState;
			this.smartHomeStateReceived = true;
			this.updateDom(this.config.initialUpdateInterval);
			this.scheduleUpdate();
		}
		if(notification === "CONNECTION_STATE"){
			this.connectionState = payload;
			this.updateDom(this.config.domUpdateInterval);
			this.connectionStateReceived = true;
		}
		if (notification === "SMARTHOME_STATE") {
			this.smartHomeState = payload;
			this.updateDom(this.config.domUpdateInterval);
			this.smartHomeStateReceived = true;
		}
	},
});
