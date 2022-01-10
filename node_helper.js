const NodeHelper = require("node_helper");
const Fritzbox = require('@seydx/fritzbox');

module.exports = NodeHelper.create({});

module.exports = NodeHelper.create({
	static: {
		serviceCall_PPP:"urn:WANPPPConnection-com:serviceId:WANPPPConnection1", 
		getInfo: "GetInfo",
		serviceCall_SmartHome: "urn:X_AVM-DE_Homeauto-com:serviceId:X_AVM-DE_Homeauto1",
		getGenericDevInfo: "GetGenericDeviceInfos"
	},
	startDeviceNum: undefined,
	endDeviceNum: undefined,
	start: function () {
		console.log("Starting node helper for: " + this.name);
	},
	initFritzbox: async function(accessValues){
		this.fritzbox = new Fritzbox({...accessValues});
		try {
			const info = await this.fritzbox.exec(this.static.serviceCall_SmartHome, this.static.getInfo);
                	this.startDeviceNum = parseInt(info.NewMinCharsAIN);
                	this.endDeviceNum = parseInt(info.NewMaxCharsAIN);
			const connectionState = await this.getConnectionState();
			const smartHomeState = await this.getSmartHomeState();
			this.sendSocketNotification("FRITZBOX_INITIALIZED", {connectionState, smartHomeState});
		} catch (err) {
			console.error(err);
		}
	},
	getConnectionState: async function(){
		try {
			const connState = await this.fritzbox.exec(this.static.serviceCall_PPP,this.static.getInfo);
			return connState;
                 } catch (err) {
			console.error(err)
		 }
	},
	getSmartHomeState: async function(){
		const devices = [];
		let startNum = this.startDeviceNum;
			try {
				while (startNum <= this.endDeviceNum) {
			        	const deviceInfo = await this.fritzbox.exec(this.static.serviceCall_SmartHome, this.static.getGenericDevInfo, {NewIndex: startNum});
					devices.push(deviceInfo);
					startNum++;
				}
			} catch(err) {
				if (err.soap.errorCode !== '713') {
					console.log(err);
				}
			}
		return devices;
   	},
	socketNotificationReceived: function (notification, payload) {
		if (notification === "INIT_FRITZBOX") {
			this.initFritzbox(payload);
                }
		if (notification === "GET_CONNECTION_STATE") {
			 this.getConnectionState().then(resp => {
			 	this.sendSocketNotification("CONNECTION_STATE", resp);
			});
		}
		if (notification === "GET_SMARTHOME_STATE"){
			this.getSmartHomeState().then(resp => {
				this.sendSocketNotification("SMARTHOME_STATE", resp);
			});
		} 
	},
});
