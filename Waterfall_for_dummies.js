/*
 * @license    Waterfall : Copyright (c) 2019, Charles-Alban Allard All rights reserved.
 * @library    d3 : Copyright (c) 2017, Michael Bostock All rights reserved.
 * @library    d3-tip : Copyright (c) 2013-2017 Justin Palmer.
 * @library    Javascript-number-formatter : Copyright (c) 2019 ecava
 * @library    momentjs : JS Foundation.
 * @release    1.0
 * @details    https://github.com/caallard/Watefall_for_dummies


*/

define( [ "qlik", "jquery","./d3.v4.min", "text!./Waterfall.css", './format', './moment', './d3-tip'],
function ( qlik, $, d3, cssContent, format, moment) {
	$( "<style>" ).html( cssContent ).appendTo( "head" );
	
	var palette =[	"none",
					"#ffffff",
					"#46c646",
					"#276e27",
					"#b6d7ea",
					"#7db8da",
					"#4477aa",
					"#8e477d",
					"#ffcf02",
					"#f8981d",
					"#f93f17",
					"#633d0c",
					"#b0afae",
					"#7b7a78",
					"#545352",
					"#000000"];
	
	return {
		initialProperties: {
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 3,
					qHeight: 3000
				}]
			}
		},
		support : {
			snapshot: true,
			export: true,
			exportData : false
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions : {
					uses : "dimensions",
					min: 2,
					max: 2
				},
				measures : {
					uses : "measures",
					min: 1,
					max: 1
				},
				/*sorting: {
					uses: "sorting"
				},*/
				settings: {
					uses: "settings",
					items: {
						Details: {
							type: "items",
							label: "Paramètres",
							items: {
								showAlsoTotalFirstValueDim: {
										type: "boolean",
										component: "switch",
										label: "Show also the total of the 1st dimension",
										ref: "params.showAlsoTotalFirstValueDim",
										options: [{
											value: true,
											label: "Yes"
										}, {
											value: false,
											label: "No"
										}],
										defaultValue: true
									},
								showZeroValue: {
										type: "boolean",
										component: "switch",
										label: "Show zero values",
										ref: "params.showZeroValue",
										options: [{
											value: true,
											label: "Yes"
										}, {
											value: false,
											label: "No"
										}],
										defaultValue: false
									},
								invertOrder: {
										type: "boolean",
										component: "switch",
										label: "Invert Order",
										ref: "params.invertOrder",
										options: [{
											value: true,
											label: "Yes"
										}, {
											value: false,
											label: "No"
										}],
										defaultValue: false
									},
								automaticOffset: {
										type: "boolean",
										component: "switch",
										label: "Set the automatic offset",
										ref: "params.automaticOffset",
										options: [{
											value: true,
											label: "Yes"
										}, {
											value: false,
											label: "No"
										}],
										defaultValue: true
									},
								limitElement: {
										type: "boolean",
										component: "switch",
										label: "Limit elements numbers",
										ref: "params.limitElement",
										options: [{
											value: true,
											label: "Yes"
										}, {
											value: false,
											label: "No"
										}],
										defaultValue: false
									},
								limitElementNumber: {
										type: "integer",
										label: "Limit number of elements",
										ref: "params.limitElementNumber",
										defaultValue: 5
									},
								colorPositive: {
									type: "object",
									ref: "params.colorPositive",
									label: "Positive color",
									dualOutput : true,
									component: "color-picker",
									defaultValue : {
									  index : 3,
									  color : null
									}
								},
								colorNegative: {
									type: "object",
									ref: "params.colorNegative",
									label: "Negative color",
									dualOutput : true,
									component: "color-picker",
									defaultValue : {
									  index : 10,
									  color : null
									},
								},
								colorOther: {
									type: "object",
									ref: "params.colorOther",
									label: "Others color",
									dualOutput : true,
									component: "color-picker",
									defaultValue : {
									  index : 12,
									  color : null
									},
								},
								colorTotal: {
									type: "object",
									ref: "params.colorTotal",
									label: "Total color",
									dualOutput : true,
									component: "color-picker",
									defaultValue : {
									  index : 6,
									  color : null
									},
								}
							}
						}
					}
				}
				
			}
		},
		paint: function ($element,layout) {
			var self = this;
			
			/////Functions
			
			moment.duration.fn.format = function (input) {
				var output = input;
				var milliseconds = this.asMilliseconds();
				var totalMilliseconds = 0;
				var replaceRegexps = {
					years: /Y(?!Y)/g,
					months: /M(?!M)/g,
					weeks: /W(?!W)/g,
					days: /D(?!D)/g,
					hours: /h(?!h)/g,
					minutes: /m(?!m)/g,
					seconds: /s(?!s)/g,
					milliseconds: /S(?!S)/g
				}
				var matchRegexps = {
					years: /Y/g,
					months: /M/g,
					weeks: /W/g,
					days: /D/g,
					hours: /h/g,
					minutes: /m/g,
					seconds: /s/g,
					milliseconds: /S/g
				}
				for (var r in replaceRegexps) {
					if (replaceRegexps[r].test(output)) {
						var as = 'as'+r.charAt(0).toUpperCase() + r.slice(1);
						var value = new String(Math.floor(moment.duration(milliseconds - totalMilliseconds)[as]()));
						var replacements = output.match(matchRegexps[r]).length - value.length;
						output = output.replace(replaceRegexps[r], value);

						while (replacements > 0 && replaceRegexps[r].test(output)) {
							output = output.replace(replaceRegexps[r], '0');
							replacements--;
						}
						output = output.replace(matchRegexps[r], '');

						var temp = {};
						temp[r] = value;
						totalMilliseconds += moment.duration(temp).asMilliseconds();
					}
				}
				return output;
			}
			
			
			
			/*function dollarFormatter(n) {
				n = Math.round(n);
				var result = n;
				if (Math.abs(n) > 1000) {
					result = Math.round(n/1000) + 'k';
				}
				return '' + result;
			}*/
			
			function dollarFormatter(numberType,numberFormat,number) {
				if(numberType=='F' || numberType=='M' || numberType=='R' ){
					return format( numberFormat,number );
				}else if(numberType=='D'){
					return moment((number-25569 )*86400, "X").format(numberFormat);
				}else if(numberType=='IV' ){
					return moment.duration(number* 24*60*60*1000).format(numberFormat);
				}else if(numberType=='U' || numberType=='I'){
					return number.toString();
				}
			}
			
			function createArray ( cube ) {
				var html = "";

				var objectArray=[];
				var objectFiels=[];
				var objectTypes=[];
				for(var i=0;i<cube.qHyperCube.qDimensionInfo.length;i++){
					objectFiels.push(cube.qHyperCube.qDimensionInfo[i].qFallbackTitle);
					objectTypes.push('qText');
				}
				for(var i=0;i<cube.qHyperCube.qMeasureInfo.length;i++){
					objectFiels.push(cube.qHyperCube.qMeasureInfo[i].qFallbackTitle);
					objectTypes.push('qNum');
				}

				$.each(cube.qHyperCube.qDataPages, function(PageNum, Page) {
					$.each(Page.qMatrix, function(key, value) {

						var return_object = {};
						return_object.selectionList = [];
						return_object.toolTip = '';
						
						for(var i=0;i<objectFiels.length;i++){
							return_object[objectFiels[i]]=value[i][objectTypes[i]];
							//return_object.toolTip += "<b> "+objectFiels[i]+" :</b> " + value[i][objectTypes[i]] +"<br>";
							return_object.toolTip += "<b> "+objectFiels[i]+" :</b> " + value[i].qText +"<br>";
							
							//pour les dimensions: ajout des valeurs séléctionnables
							if(objectTypes[i]=='qText'){
								return_object.selectionList[i]=value[i].qElemNumber;
							}
						}

						if(objectArray[value[0][objectTypes[0]]]===undefined){
							objectArray[value[0][objectTypes[0]]]=[];
						}
						objectArray[value[0][objectTypes[0]]][value[1][objectTypes[1]]]=return_object;
					})
				})
				;
				
				
				return {'fields':objectFiels,'array':objectArray};
				}
	
			
			
			/////EndFunctions
			
			
			var id=layout.qInfo.qId;
			console.log( '-----------------------------------------------' );
			console.log( 'Thank you for using our Watefall, just enjoy ;)' );
			console.log( '-----------------------------------------------' );
			console.log( '--------------'+id );
			console.log( '--------------1' );
			
			var fullArray = createArray( layout );
			var data = fullArray.array;
			var fields = fullArray.fields;
			
			/*
			U for UNKNOWN type.
			A for ASCII; Numeric fields values contain only standard ASCII characters.
			I for INTEGER; Numeric fields values are shown as integer numbers.
			R for REAL; Numeric fields values are shown as real numbers.
			F for FIX; Numeric fields values are shown as numbers with a fix number of decimals.
			M for MONEY; Numeric fields values are shown as in the money format.
			D for DATE; Numeric fields values are shown as dates.
			T for TIME; Numeric fields values are shown as times.
			TS for TIMESTAMP; Numeric fields values are shown as time stamps.
			IV for INTERVAL; Numeric fields values are shown as intervals.
			*/
			
			var numberFormat='';
			var mesure=layout.qHyperCube.qMeasureInfo[0];
			var numberType=mesure.qNumFormat.qType;
			if(numberType=='F' || numberType=='M' || numberType=='R' ){
				if(mesure.qNumFormat.qFmt===undefined){
					var thou='';
					if(mesure.qNumFormat.qUseThou != 0){
						thou=mesure.qNumFormat.qThou;
					}
					numberFormat='#'+thou+'##0'+mesure.qNumFormat.qDec + '0'.repeat(mesure.qNumFormat.qnDec);
				}else{
					numberFormat=mesure.qNumFormat.qFmt.split(';')[0];
					if(numberFormat.indexOf(mesure.qNumFormat.qDec)== -1){
						numberFormat+=mesure.qNumFormat.qDec;
					}

				}
			}else if(numberType=='D' || numberType=='IV' ){
				numberFormat=mesure.qNumFormat.qFmt.split(';')[0];
			}
			
			
			
			console.log( '--------------2' );

			
			if(layout.params.colorPositive.index>=0){
				layout.params.colorPositive.finalColor = palette[layout.params.colorPositive.index];
			}else{
				layout.params.colorPositive.finalColor = layout.params.colorPositive.color;
			};
			
			if(layout.params.colorNegative.index>=0){
				layout.params.colorNegative.finalColor = palette[layout.params.colorNegative.index];
			}else{
				layout.params.colorNegative.finalColor = layout.params.colorNegative.color;
			};
			
			if(layout.params.colorOther.index>=0){
				layout.params.colorOther.finalColor = palette[layout.params.colorOther.index];
			}else{
				layout.params.colorOther.finalColor = layout.params.colorOther.color;
			};
			
			if(layout.params.colorTotal.index>=0){
				layout.params.colorTotal.finalColor = palette[layout.params.colorTotal.index];
			}else{
				layout.params.colorTotal.finalColor = layout.params.colorTotal.color;
			};
			
			
			
			
			
			console.log( '--------------3' );
			
			var previous;
			Object.keys(data).forEach( function ( key1 ) {
				Object.keys(data[key1]).forEach( function ( key2 ) {
					
					data[key1][key2].value=data[key1][key2][fields[2]];
					data[key1][key2].name=data[key1][key2][fields[1]];
					//Ajout des valeurs ayant disparues de la periode précédente
					if(previous===undefined){
						data[key1][key2].previousValue=0;
					} else {
						if(previous[key2]===undefined){
							data[key1][key2].previousValue=0;
						}else{
							if(previous[key2][fields[2]]===undefined){
								data[key1][key2].previousValue=0;
							}else{
								data[key1][key2].previousValue=previous[key2][fields[2]];
							}
						}
					}
					
				});
				//Ajout des valeurs ayant disparues de la periode suivante
				if(previous===undefined){}else{
					Object.keys(previous).forEach( function ( key2 ) {
						if(data[key1][key2]===undefined){
							data[key1][key2]={};
							//Previous valeur
							data[key1][key2].previousValue=previous[key2].value;
							data[key1][key2].name=previous[key2].name;
							//Valeur à 0
							data[key1][key2].value=0;
						}
					});
				}
				

				
				previous=data[key1];
			});
			
			
			
			
			var dataEnd=[];
			var cumulative = 0;
			var firstkey = true;
			var minValue;
			var maxValue;
			Object.keys(data).forEach( function ( key1 ) {
				var dataIntermediate=[];
				
				
				
				
				Object.keys(data[key1]).forEach( function ( key2 ) {
					var returnObject = {};
					returnObject.name=key1+" - "+key2;
					returnObject.previousValue=data[key1][key2].previousValue;
					returnObject.realvalue=data[key1][key2].value;
					returnObject.value=data[key1][key2].value - data[key1][key2].previousValue;
					returnObject.selectionList=data[key1][key2].selectionList;
					returnObject.toolTip=data[key1][key2].toolTip;
					if(returnObject.toolTip===undefined){
						returnObject.toolTip='';
					}
					returnObject.toolTip += "<b> Difference :</b> " + dollarFormatter(numberType,numberFormat,returnObject.value) +"<br>";
					
					dataIntermediate.push(returnObject);
				});
				
				dataIntermediate.sort(function(a, b) {
					
				  	return Math.abs(b.value) - Math.abs(a.value);
				  
				});
				
				
				for (var i = 0; i < dataIntermediate.length; i++) {
					var mode = 'show';
					//si limitation de l'affichage
					if(i>=layout.params.limitElementNumber && layout.params.limitElement){
						mode = 'hide';
					}
					dataIntermediate[i].mode=mode;
				}
				
				dataIntermediate.sort(function(a, b) {
				  if(layout.params.invertOrder){
				  	if(b.mode==a.mode){
						return a.value - b.value;
					}else{
						if(b.mode=='show'){
							if(b.value>=0){
								return -1;
							}else{
								return 1;
							}
						}else{
							//return -1;
							if(b.value>=0){
								return 1;
							}else{
								return -1;
							}
						}
					}
				  }else{
				  	if(b.mode==a.mode){
						return b.value - a.value;
					}else{
						if(b.mode=='show'){
							if(b.value>=0){
								return 1;
							}else{
								return -1;
							}
						}else{
							//return -1;
							if(b.value>=0){
								return -1;
							}else{
								return 1;
							}
						}
					}
				  	
					
				  }
				  
				});				

				
				var totalValue;
				var otherObject={};
				dataIntermediate.forEach( function ( returnObject ) {
					returnObject.start = cumulative;
					cumulative += returnObject.value;
					returnObject.end = cumulative;
					returnObject.class = ( returnObject.value >= 0 ) ? 'positive' : 'negative';
					returnObject.color = ( returnObject.value >= 0 ) ? layout.params.colorPositive.finalColor : layout.params.colorNegative.finalColor;
					if(returnObject.mode == 'hide'){
						returnObject.class='other';
					}
					returnObject.lastElement = false;
					if(layout.params.showZeroValue==true || returnObject.value != 0){
						if(layout.params.showAlsoTotalFirstValueDim==false || firstkey == false){
							
							if(returnObject.mode == 'hide'){
								//premiere valeur
								if(otherObject.start===undefined){
									otherObject.start=returnObject.start;
									otherObject.selectionList=[];
								}
								//dernière valeur
								otherObject.end=returnObject.end;
								otherObject.value=otherObject.end-otherObject.start;
								otherObject.class = ( otherObject.value >= 0 ) ? 'positive' : 'negative';
								otherObject.class='other';
								otherObject.color=layout.params.colorOther.finalColor;
								otherObject.name= 'Other'+" "+key1;
								otherObject.toolTip= "<b>Other "+key1+" :</b> " + dollarFormatter(numberType,numberFormat,otherObject.value) +"<br>";
								otherObject.lastElement = false;
								if(returnObject.selectionList===undefined){}else{
									returnObject.selectionList.forEach( function ( value, key ){
										if(otherObject.selectionList[key]===undefined){
											otherObject.selectionList[key]=[];
										}
										otherObject.selectionList[key].push(value);
									});
								}
							}else{
								//On injecte les autres si il y a une valeur
								if(otherObject.start===undefined){}else{
									dataEnd.push(otherObject);
									otherObject={};
								}
								dataEnd.push(returnObject);
							}
							
							if(minValue===undefined || returnObject.start<minValue){
								minValue=returnObject.start;
							}
							if(minValue===undefined || returnObject.end<minValue){
								minValue=returnObject.end;
							}
							if(maxValue===undefined || returnObject.end>maxValue){
								maxValue=returnObject.end;
							}
							if(maxValue===undefined || returnObject.start>maxValue){
								maxValue=returnObject.start;
							}
						}
					}
					if(returnObject.selectionList===undefined || returnObject.selectionList[0]===undefined){}else{
						totalValue = returnObject.selectionList[0];
					}
					
				});
				//On injecte les autres si il y a une valeur
				if(otherObject.start===undefined){}else{
					dataEnd.push(otherObject);
					otherObject={};
				}
				
				if(minValue===undefined || cumulative<minValue){
					minValue=cumulative;
				}
				if(maxValue===undefined || cumulative>maxValue){
					maxValue=cumulative;
				}
				dataEnd.push({
					name: 'Total '+key1,
					end: cumulative,
					start: 0,
					class: 'total',
					color: layout.params.colorTotal.finalColor,
					lastElement: false,
					mode:'show',
					toolTip: "<b>Total "+key1+" :</b> " + dollarFormatter(numberType,numberFormat,cumulative) +"<br>",
					selectionList: [totalValue]
				});
				
				firstkey = false;
			});
			dataEnd[dataEnd.length-1].lastElement=true;
			

			var textMaxLength = 0;
			dataEnd.forEach( function ( returnObject ) {
				if(textMaxLength<returnObject.name.length){
					textMaxLength=returnObject.name.length;
				}
			});

			var offset= 0;
			if(Math.round(minValue - (maxValue-minValue)/3)>0 && layout.params.automaticOffset && maxValue!=minValue){
				offset=Math.round(minValue - (maxValue-minValue)/8);
			}
			
			
			
			/////Rendu
			$element.html( '<div id="'+id+'" class="qv-object-Waterfall" ><svg class="chart_'+id+'"></svg></div>' );

			var zone = d3.select("#"+id).node().getBoundingClientRect();
			
			
			console.log( '--------------4' );
			var zonewidth=Math.floor(zone.width)-1;
			var zoneheight=Math.floor(zone.height)-20;
			//gestion des libellés sur l'axe: au maxi 1/2 de la zone
			var bottom=30;
			var textHeight=textMaxLength*5.5;
			if (textHeight < zoneheight/2){
				bottom=textHeight;
			}else{
				bottom=zoneheight/2;
			}
			
			
			if((zonewidth-70)/dataEnd.length < 28.5){
				zonewidth=28.5*dataEnd.length + 70
			}
			
			var left = Math.max(dollarFormatter(numberType,numberFormat,Math.round(maxValue)).length,dollarFormatter(numberType,numberFormat,Math.round(minValue)).length)*7.5 +10;
			var margin = {top: 20, right: 30, bottom: bottom, left: left},
				width = zonewidth - margin.left - margin.right,
				height = zoneheight - margin.top - margin.bottom,
				padding = 0.3;
			console.log( '--------------4.1' );
				
			var x = d3.scaleBand()
    			.range([0, width])
    			.round(padding);
			var y = d3.scaleLinear()
				.range([height, 0]);
			var xAxis = d3.axisBottom(x);
			var yAxis = d3.axisLeft(y)
				.tickArguments([ Math.round(height/75), "s"])
				.tickFormat(function(d) { return dollarFormatter(numberType,numberFormat,d); });
			console.log( '--------------5' );
			var chart = d3.select(".chart_"+id)
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
			  .append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			console.log( '--------------6' );
			
			
			
			// gridlines in y axis function
			function make_y_gridlines() {		
				return d3.axisLeft(y)
					.ticks( Math.round(height/75))
			}
			
			
			
			
			console.log( '--------------7' );
			x.domain(dataEnd.map(function(d) { return d.name; }));
			y.domain([offset, d3.max(dataEnd, function(d) { return d.end; })]);
			

			chart.append("g")
			  .attr("class", "x axis")
			  .attr("transform", "translate(0," + height + ")")
			  .call(xAxis)
			  .selectAll("text")
			  .attr("transform", function(d,a,b) {
				var length = b[a].textLength.baseVal.value;
				var height = b[a].dy.baseVal[0].value;
			  	return "translate("+ -length/2 +",0) rotate(-45,"+ length/2 +","+ height +")";
			  });
			  
			  
			  // add the Y gridlines
			  chart.append("g")			
				  .attr("class", "grid")
				  .call(make_y_gridlines()
					  .tickSize(-width)
					  .tickFormat("")
				  );

			chart.append("g")
			  .attr("class", "y axis")
			  .call(yAxis);
			console.log( '--------------8' );
			var bar = chart.selectAll(".bar")
			  .data(dataEnd)
			.enter().append("g")
			  .attr("class", function(d) { return "bar " + d.class })
			  .attr("transform", function(d) { return "translate(" + x(d.name) + ",0)"; });
			console.log( '--------------8.1' );
			bar.append("rect")
			  .attr("class", "barZone")
			  .attr("fill", function(d) {return d.color;})
			  .attr("y", function(d) { return y( Math.max(d.start, d.end) ); })
			  .attr("height", function(d) { 
			  	//Gestion de l'offset
				var start = d.start;
			  	if(start<offset){
					start=offset;
				}
			  
			  return Math.abs( y(start) - y(d.end) ); 
			  
			  })
			  .attr("width", x.bandwidth());
			console.log( '--------------8.2' );
			bar.append("text")
			  .attr("x", x.bandwidth() / 2)
			  .attr("y", function(d) { return y(d.end) + 5; })
			  .attr("dy", function(d) { return ((d.class=='negative') ? '-' : '') + ".75em" })
			  .text(function(d) { 
			  
					//Gestion de l'offset
					var start = d.start;
					if(start<offset){
						start=offset;
					}
					var textHeight=Math.abs( y(start) - y(d.end) ); 
					if(textHeight>=14.5){
						return dollarFormatter(numberType,numberFormat, d.end - d.start);
					}
			  });
			console.log( '--------------8.3' );
			bar.filter(function(d) { return d.lastElement == false }).append("line")
			  .attr("class", "connector")
			  .attr("x1", x.bandwidth() )
			  .attr("y1", function(d) { return y(d.end) } )
			  .attr("x1", x.bandwidth() *2)
			  .attr("y2", function(d) { return y(d.end) } )
			  ;
			console.log( '--------------8.4' );
			var tool_tip = d3.tip()
			  .attr("class", "qv-object-Waterfall d3-tip")
				.style("position", "absolute")
				.style("z-index", "10")
				.offset([-8, 0])
				.html(function(d) {
					var htmlList= [];
					return d.toolTip;
				});
			chart.call(tool_tip);
			
			var selectedDim=[];
			bar.append("rect")
			  .attr("class", "selectableZone")
			  .attr("y", function(d) { return y( Math.max(d.start, d.end) ); })
			  .attr("height", function(d) { 
			  	//Gestion de l'offset
				var start = d.start;
			  	if(start<offset){
					start=offset;
				}
			  
			  return Math.abs( y(start) - y(d.end) ); 
			  
			  })
			  .attr("width", x.bandwidth())
			  .on('mouseover', tool_tip.show)
      		  .on('mouseout', tool_tip.hide)
			  .on("click", function(dataClick){
					
					if(dataClick.selectionList===undefined){
						console.log('!!!!!!!!!!!!!!!!!!!!!!!');
					}else{
					
						if(d3.select(this).classed("selected")){
							//Unselect
							d3.select(this).classed("selected", false);
							dataClick.selectionList.forEach( function ( value, key ){
								//si il y a plusieurs valeurs on boucle
								if(Array.isArray(value)){
									value.forEach( function ( value ){
										selectedDim[key][value]--;
										//Si il y a plus de valeurs séléctionnée, on déséléctionne
										if(selectedDim[key][value]==0){
											self.selectValues(key, [value], true);
										}
									});
								
								}else{
									selectedDim[key][value]--;
									//Si il y a plus de valeurs séléctionnée, on déséléctionne
									if(selectedDim[key][value]==0){
										self.selectValues(key, [value], true);
									}
								}
								

							});
						}else{
							//Select
							d3.select(this).classed("selected", true);
							dataClick.selectionList.forEach( function ( value, key ){
								if(selectedDim[key]===undefined){
									selectedDim[key]=[];
								}
								//si il y a plusieurs valeurs on boucle
								if(Array.isArray(value)){
									value.forEach( function ( value ){
										if(selectedDim[key][value]===undefined){
											selectedDim[key][value]=0;
										}
										selectedDim[key][value]++;
										//si c'est la première fois que l'on sélectionne: on sélectionne
										if(selectedDim[key][value]==1){
											self.selectValues(key, [value], true);
										}
									});
								}else{
									if(selectedDim[key][value]===undefined){
										selectedDim[key][value]=0;
									}
									selectedDim[key][value]++;
									//si c'est la première fois que l'on sélectionne: on sélectionne
									if(selectedDim[key][value]==1){
										self.selectValues(key, [value], true);
									}
								}
									
							});
						}
					}
					
					
				});

			console.log( '--------------9' );
			//needed for export
			return qlik.Promise.resolve();
		}
	};

} );

