/***
	画一个饼图
	Pie chart

	datalist = [
		{
			number:10				
			name:
			des:
		},
		{
			number:10				
			name:
			des:
		}
	];

	options = {
		
		r://半径
		centerPoint://中心点位置

		
	}
*/

function PieChart( datalist, options ){

	var options = options || {};
	
	this.svg = options.svg;
	this.r = options.r || 100;
	this.centerPoint = options.centerPoint || {
			x:((this.svg.getAttribute('width') || this.svg.clientWidth)-this.r*2)/2, 
			y:((this.svg.getAttribute('height') || this.svg.clientHeight)-this.r*2)/2
	};
	this.datalist = datalist;

	this.startPoint = {x:0, y:this.r};
	this.originPoint = {x:0, y:0};
	this.pieList = [];
	this.init();
}

PieChart.prototype = {

	constructor:PieChart,

	init:function(){
		//datalist
		/**
			pieData = [
				{
					number:
					name:
					des:

					angle:
					color:
					p1:
					p2:
					p3:	
				}
			]
		*/
		var centerPoint = this.originPoint;//this.centerPoint;
		var i=0;
		var s=0; 
		var data=this.datalist;
		var pieList = this.pieList;
		var angle = 0;
		var p3 = null;
		var json = null;

		this.sort(data, "number");

		for(; i< data.length; i++){
			s += data[i].number;
		}

		for(i=0; i<data.length; i++){
			//到下一点需要旋转的角度
			angle = 2 * Math.PI * data[i].number/s;

			//第3点的位置
			p3 = this.rotatingPoint(this.startPoint.x, this.startPoint.y, angle);
			
			//添加数据
			pieList.push({

				number:data[i].number,
				name:data[i].name,
				des:data[i].des,
				angle:angle,//角度
				percentage: data[i].number/s,//百分比
				color:data[i].color || "#ccc",
				p1:this.getScreenSystem( centerPoint ),
				p2:this.getScreenSystem(this.startPoint),
				p3:this.getScreenSystem(p3)
			});

			this.startPoint = p3;
			//
			this.createPie( pieList[i] );
			this.createText( pieList[i] );	
		}
		this.setTextsPosition();
		this.regEvent();

	},
	/*
		把传入的数据排序
	*/
	sort:function( data, key ){
		return data.sort(function(a, b){
			//console.log(a[key], b[key]);
			return b[key] - a[key];
		});
	},
	//旋转一个点
	rotatingPoint:function(x, y, angle){
		return {
			x:x*Math.cos(-angle) - y*Math.sin(-angle),
			y:y*Math.cos(-angle) + x*Math.sin(-angle)
		}
	},
	// 获取屏幕坐标系
	getScreenSystem:function( p ){

		return { 
			x: p.x + this.centerPoint.x,
			y: p.y + this.centerPoint.y
		};

	},

	// 获取坐标系坐标
	getCartesianCoordinates:function( p ){
 
		return {

			x:p.x - this.centerPoint.x,
			y:p.y - this.centerPoint.y
		}	

	},

	//创建弧度
	createPie:function( item ){
		var path = new SVGPath(item.p1, item.p2, item.p3);

		item.pathNode = path;
		if(item.angle > Math.PI){

			path.setLarge( 1 );

		}
		path.setAttr("title", item.name);
		path.setStrokeWidth(1);
		path.setStroke("#fff");
		path.setFill(item.color);
		this.svg.appendChild( path.node );
	},
	regEvent:function(){

		var _this = this;
		var priveItem = null;
		var timeout = null;
		var pieList = this.pieList;

		for(var i=0; i<pieList.length; i++){
			bind( pieList[i] );
			
		}

		function bind( item ){

			item.pathNode.bind('mouseover', function(e){
				clearTimeout( timeout );
				priveItem && _this.reduction( priveItem );
				_this.prominent( item);
				priveItem = item;
			});

			item.pathNode.bind('mouseout', function(e){
				timeout = setTimeout(function(){
					_this.reduction( priveItem );
				}, 500);
			});

		}

	},
    reduction:function( item ){
    	
    	item.pathNode.setAttr("transform", "transform(0, 0)");
    	item.textNode.setFill("inherit");
        //piePath.setP1( piePath.src.p1 );
        //piePath.setP2( piePath.src.p2 );
        //piePath.setP3( piePath.src.p3 );
    },
    // 使用transform:translate(x, y) 来突出一个弧度
    prominent:function( item ){
    	var piePath =  item.pathNode;
    	if(!piePath.transform){

	    	var p1 = piePath.p1;
	        var p2 = piePath.p2;
	        var p3 = piePath.p3;
	        //首先计算底边中点
	        var centerPoint = {x:(p2.x+p3.x) / 2, y:(p2.y+p3.y)/2};
	        //用中点减去定点得到向量
	        var v = {x:centerPoint.x - p1.x, y:centerPoint.y - p1.y};
	        var v0 = {x: v.x / Math.sqrt(v.x*v.x + v.y*v.y), y: v.y/Math.sqrt(v.x*v.x + v.y*v.y)};
	        piePath.transform = {x:v0.x * 10, y: v0.y * 10};
    	}

    	piePath.setAttr("transform", "translate("+piePath.transform.x+", "+piePath.transform.y+")");
    	item.textNode.setFill("#f30");
    },

    /*
		createText 
		图标文字绘制
    */ 


    createText:function( item ){

    	if(!this.gNode){
    		this.textHeight = 0;
    		this.gNode = new SVGNode("g");
    		this.gNode.initialize();
    		this.gNode.setFill("#666");
    		//this.gNode.translate(this.centerPoint.x + this.r + 20, this.centerPoint.y);
    		this.svg.appendChild( this.gNode.node );
    	}

   		var text = new SVGNode("text");
    	var tspan = new SVGNode("tspan");
    		text.initialize();
    		tspan.initialize();
    	//text.setFill("#ccc");
    	tspan.node.textContent = item.name + ", " +parseInt(item.percentage*10000)/100+"%";
		text.append( tspan.node );
		text.translate(0, this.textHeight);
    	this.gNode.append( text.node );
		this.textHeight += text.node.getBBox().height + 5;
		item.textNode = text;
    },
    setTextsPosition:function(x, y){
    	x = x || this.centerPoint.x + this.r + 40;
    	y = y || this.centerPoint.y + this.r - this.textHeight;	
    	this.gNode.translate(x, y);
    },
	/**
		突出一个弧度

		计算方式
			1：首先计算底边的中点，
			2：用中点减去定点得到向量，把向量化为单位向量
			3：单位向量乘以一个偏移量（目前偏移量是使用弧形半径的0.1）
			4： 弧形的3个定点分别 加 第3步的结果。
				特别注意如果弧度大于 Math.PI 定点于偏移量用减法
	*/
/*	
    prominent1:function( piePath ){

        //保存原始值

        if( !piePath.src ){
            piePath.src = {
                p1:piePath.p1,
                p2:piePath.p2,
                p3:piePath.p3
            };
        }

        if( !piePath.newPos ){
            piePath.newPos = {};
            var p1 = piePath.p1;
            var p2 = piePath.p2;
            var p3 = piePath.p3;
            //首先计算底边中点
            var centerPoint = {x:(p2.x+p3.x) / 2, y:(p2.y+p3.y)/2};
            //用中点减去定点得到向量
            var v = {x:centerPoint.x - p1.x, y:centerPoint.y - p1.y};
            //把向量化为单位向量
            var v0 = {x: v.x / Math.sqrt(v.x*v.x + v.y*v.y), y: v.y/Math.sqrt(v.x*v.x + v.y*v.y)};
            //弧形的3个定点分别 加 第3步的结果
            var v2 = {x:v0.x*10, y:v0.y*10};
            *辅助代码
             var handles = piePath.createHandle( 1 );
             var p1node = $(handles[0]);

             p1node.css({
                top:centerPoint.y,
                left:centerPoint.x
            });

             p1node.init();
             

            // 特别注意如果弧度大于 Math.PI 定点于偏移量用减法
            if(piePath.largeFlag == 0){
                piePath.newPos.p1 = addSelf(p1, v2);
                piePath.newPos.p2 = addSelf(p2, v2);
                piePath.newPos.p3 = addSelf(p3, v2);
            }else{
                piePath.newPos.p1 = subSelf(p1, v2);
                piePath.newPos.p2 = subSelf(p2, v2);
                piePath.newPos.p3 = subSelf(p3, v2);
            }
        }

        piePath.setP1( piePath.newPos.p1 );
        piePath.setP2( piePath.newPos.p2 );
        piePath.setP3( piePath.newPos.p3 );

        function addSelf(v, v2){

            return {

                x:v.x + v2.x,
                y:v.y + v2.y

            }
        }

        function subSelf(v, v2){
            return {

                x:v.x - v2.x,
                y:v.y - v2.y

            }
        }

    }*/

};