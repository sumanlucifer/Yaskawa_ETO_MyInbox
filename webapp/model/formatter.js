sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		removeLeadZero: function (sValue) {

			// if (sValue === "Leaves") {

			//     return 'sap-icon://create-leave-request';

			// } else if (sValue === "Business Trip") {
			//     return 'sap-icon://stethoscope';
			// } else if (sValue === "Health Insurance") {
			//     return 'sap-icon://flight';
			// } 
			var sString = sValue;
			var sparsed = sString.replace(/^0+/, "");
			return sparsed;
		},
		dateFormater: function (sValue) {
			var sString = sValue;
			var syear = sString.slice(0, 4),
				sMonth = sString.slice(4, 6),
				sDate = sString.slice(6, 8);
			var sparsedDate = `${sMonth}-${sDate}-${syear}`
			return sparsedDate;
		}

	};

});