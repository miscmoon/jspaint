
function render_brush(ctx, shape, size){
	if(shape === "circle"){
		size /= 2;
		size += 0.25;
	}else if(shape.match(/diagonal/)){
		size -= 0.4;
	}
	
	var mid_x = ctx.canvas.width / 2;
	var left = ~~(mid_x - size/2);
	var right = ~~(mid_x + size/2);
	var mid_y = ctx.canvas.height / 2;
	var top = ~~(mid_y - size/2);
	var bottom = ~~(mid_y + size/2);
	
	if(shape === "circle"){
		draw_ellipse(ctx, left, top, size, size);
	}else if(shape === "square"){
		ctx.fillRect(left, top, ~~size, ~~size);
	}else if(shape === "diagonal"){
		draw_line(ctx, left, top, right, bottom);
	}else if(shape === "reverse_diagonal"){
		draw_line(ctx, left, bottom, right, top);
	}else if(shape === "horizontal"){
		draw_line(ctx, left, mid_y, size, mid_y);
	}else if(shape === "vertical"){
		draw_line(ctx, mid_x, top, mid_x, size);
	}
}

function draw_ellipse(ctx, x, y, w, h, stroke, fill){
	
	var stroke_color = ctx.strokeStyle;
	var fill_color = ctx.fillStyle;
	
	var cx = x + w/2;
	var cy = y + h/2;
	
	if(aliasing){
		// @TODO: use proper raster ellipse algorithm
		
		var r1 = Math.round;
		var r2 = Math.round;
		
		ctx.fillStyle = stroke_color;
		for(var r=0; r<TAU; r+=0.01){
			var rx = Math.cos(r) * w/2;
			var ry = Math.sin(r) * h/2;
			
			var rect_x = r1(cx+rx);
			var rect_y = r1(cy+ry);
			var rect_w = r2(-rx*2);
			var rect_h = r2(-ry*2);
			
			ctx.fillRect(rect_x+1, rect_y, rect_w, rect_h);
			ctx.fillRect(rect_x, rect_y+1, rect_w, rect_h);
			ctx.fillRect(rect_x-1, rect_y, rect_w, rect_h);
			ctx.fillRect(rect_x, rect_y-1, rect_w, rect_h);
		}
		ctx.fillStyle = fill_color;
		for(var r=0; r<TAU; r+=0.01){
			var rx = Math.cos(r) * w/2;
			var ry = Math.sin(r) * h/2;
			ctx.fillRect(
				r1(cx+rx),
				r1(cy+ry),
				r2(-rx*2),
				r2(-ry*2)
			);
		}
	}else{
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }
		ctx.beginPath();
		ctx.ellipse(cx, cy, w/2, h/2, 0, TAU, false);
		ctx.stroke();
		ctx.fill();
	}
}

function draw_rounded_rectangle(ctx, x, y, width, height, radius){
	
	var stroke_color = ctx.strokeStyle;
	var fill_color = ctx.fillStyle;
	
	if(aliasing){
		// @TODO: use proper raster rounded rectangle algorithm
		
		var iw = width - radius*2;
		var ih = height - radius*2;
		var ix = x + radius;
		var iy = y + radius;
		
		var r1 = Math.round;
		var r2 = Math.round;
		
		ctx.fillStyle = stroke_color;
		for(var r=0; r<TAU; r+=0.05){
			var rx = Math.cos(r) * radius;
			var ry = Math.sin(r) * radius;
			
			var rect_x = r1(ix+rx);
			var rect_y = r1(iy+ry);
			var rect_w = r2(iw-rx*2);
			var rect_h = r2(ih-ry*2);
			
			ctx.fillRect(rect_x+1, rect_y, rect_w, rect_h);
			ctx.fillRect(rect_x, rect_y+1, rect_w, rect_h);
			ctx.fillRect(rect_x-1, rect_y, rect_w, rect_h);
			ctx.fillRect(rect_x, rect_y-1, rect_w, rect_h);
		}
		ctx.fillStyle = fill_color;
		for(var r=0; r<TAU; r+=0.05){
			var rx = Math.cos(r) * radius;
			var ry = Math.sin(r) * radius;
			ctx.fillRect(
				r1(ix+rx),
				r1(iy+ry),
				r2(iw-rx*2),
				r2(ih-ry*2)
			);
		}
	}else{
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}
}

var line_brush_canvas;
var line_brush_canvas_rendered_shape;
var line_brush_canvas_rendered_color;
var line_brush_canvas_rendered_size;
function update_brush_for_drawing_lines(stroke_size){
	if(aliasing && stroke_size > 1){
		// TODO: DRY brush caching code
		if(
			line_brush_canvas_rendered_shape !== "circle" ||
			line_brush_canvas_rendered_color !== stroke_color ||
			line_brush_canvas_rendered_size !== stroke_size
		){
			// don't need to do brush_ctx.disable_image_smoothing() currently because images aren't drawn to the brush
			var csz = stroke_size * 2.1; // XXX: magic constant duplicated from tools.js
			line_brush_canvas = new Canvas(csz, csz);
			line_brush_canvas.width = csz;
			line_brush_canvas.height = csz;
			line_brush_canvas.ctx.fillStyle = line_brush_canvas.ctx.strokeStyle = stroke_color;
			render_brush(line_brush_canvas.ctx, "circle", stroke_size);

			line_brush_canvas_rendered_shape = "circle";
			line_brush_canvas_rendered_color = stroke_color;
			line_brush_canvas_rendered_size = stroke_size;
		}
	}
}

function draw_line(ctx, x1, y1, x2, y2, stroke_size){
	stroke_size = stroke_size || 1;
	if(aliasing){
		if(stroke_size > 1){
			bresenham_line(x1, y1, x2, y2, function(x, y){
				ctx.drawImage(line_brush_canvas, ~~(x - line_brush_canvas.width/2), ~~(y - line_brush_canvas.height/2));
			});
		}else{
			bresenham_line(x1, y1, x2, y2, function(x, y){
				ctx.fillRect(x, y, 1, 1);
			});
		}
	}else{
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		
		ctx.lineWidth = stroke_size;
		ctx.lineCap = "round";
		ctx.stroke();
		ctx.lineCap = "butt";
	}
}

function bresenham_line(x1, y1, x2, y2, callback){
	// Bresenham's line algorithm
	x1=~~x1, x2=~~x2, y1=~~y1, y2=~~y2;
	
	var dx = Math.abs(x2 - x1);
	var dy = Math.abs(y2 - y1);
	var sx = (x1 < x2) ? 1 : -1;
	var sy = (y1 < y2) ? 1 : -1;
	var err = dx - dy;
	
	while(1){
		callback(x1, y1);
		
		if(x1===x2 && y1===y2) break;
		var e2 = err*2;
		if(e2 >-dy){ err -= dy; x1 += sx; }
		if(e2 < dx){ err += dx; y1 += sy; }
	}
}

function brosandham_line(x1, y1, x2, y2, callback){
	// Bresenham's line argorithm with a callback between going horizontal and vertical
	x1=~~x1, x2=~~x2, y1=~~y1, y2=~~y2;
	
	var dx = Math.abs(x2 - x1);
	var dy = Math.abs(y2 - y1);
	var sx = (x1 < x2) ? 1 : -1;
	var sy = (y1 < y2) ? 1 : -1;
	var err = dx - dy;
	
	while(1){
		callback(x1, y1);
		
		if(x1===x2 && y1===y2) break;
		var e2 = err*2;
		if(e2 >-dy){ err -= dy; x1 += sx; }
		callback(x1, y1);
		if(e2 < dx){ err += dx; y1 += sy; }
	}
}

function draw_fill(ctx, x, y, fill_r, fill_g, fill_b, fill_a){
	
	// TODO: split up processing in case it takes too long?
	// progress bar and abort button (outside of image-manipulation.js)
	// or at least just free up the main thread every once in a while
	// TODO: speed up with typed arrays? https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
	// could avoid endianness issues if only copying colors
	// the jsperf only shows ~15% improvement
	// maybe do something fancier like special-casing large chunks of single-color image
	// (octree? or just have a higher level stack of chunks to fill and check at if a chunk is homogeneous)

	var stack = [[x, y]];
	var c_width = canvas.width;
	var c_height = canvas.height;
	var id = ctx.getImageData(0, 0, c_width, c_height);
	pixel_pos = (y*c_width + x) * 4;
	var start_r = id.data[pixel_pos+0];
	var start_g = id.data[pixel_pos+1];
	var start_b = id.data[pixel_pos+2];
	var start_a = id.data[pixel_pos+3];
	
	if(
		fill_r === start_r &&
		fill_g === start_g &&
		fill_b === start_b &&
		fill_a === start_a
	){
		return;
	}
	
	while(stack.length){
		var new_pos, x, y, pixel_pos, reach_left, reach_right;
		new_pos = stack.pop();
		x = new_pos[0];
		y = new_pos[1];

		pixel_pos = (y*c_width + x) * 4;
		while(matches_start_color(pixel_pos)){
			y--;
			pixel_pos = (y*c_width + x) * 4;
		}
		reach_left = false;
		reach_right = false;
		while(true){
			y++;
			pixel_pos = (y*c_width + x) * 4;
			
			if(!(y < c_height && matches_start_color(pixel_pos))){
				break;
			}
			
			color_pixel(pixel_pos);

			if(x > 0){
				if(matches_start_color(pixel_pos - 4)){
					if(!reach_left){
						stack.push([x - 1, y]);
						reach_left = true;
					}
				}else if(reach_left){
					reach_left = false;
				}
			}

			if(x < c_width-1){
				if(matches_start_color(pixel_pos + 4)){
					if(!reach_right){
						stack.push([x + 1, y]);
						reach_right = true;
					}
				}else if(reach_right){
					reach_right = false;
				}
			}

			pixel_pos += c_width * 4;
		}
	}
	ctx.putImageData(id, 0, 0);

	function matches_start_color(pixel_pos){
		return (
			id.data[pixel_pos+0] === start_r &&
			id.data[pixel_pos+1] === start_g &&
			id.data[pixel_pos+2] === start_b &&
			id.data[pixel_pos+3] === start_a
		);
	}

	function color_pixel(pixel_pos){
		id.data[pixel_pos+0] = fill_r;
		id.data[pixel_pos+1] = fill_g;
		id.data[pixel_pos+2] = fill_b;
		id.data[pixel_pos+3] = fill_a;
	}
}

function draw_noncontiguous_fill(ctx, x, y, fill_r, fill_g, fill_b, fill_a){
	
	var c_width = canvas.width;
	var c_height = canvas.height;
	var id = ctx.getImageData(0, 0, c_width, c_height);
	pixel_pos = (y*c_width + x) * 4;
	var start_r = id.data[pixel_pos+0];
	var start_g = id.data[pixel_pos+1];
	var start_b = id.data[pixel_pos+2];
	var start_a = id.data[pixel_pos+3];
	
	if(
		fill_r === start_r &&
		fill_g === start_g &&
		fill_b === start_b &&
		fill_a === start_a
	){
		return;
	}
	
	for(var i=0; i<id.data.length; i+=4){
		if(matches_start_color(i)){
			color_pixel(i);
		}
	}
	
	ctx.putImageData(id, 0, 0);

	function matches_start_color(pixel_pos){
		return (
			id.data[pixel_pos+0] === start_r &&
			id.data[pixel_pos+1] === start_g &&
			id.data[pixel_pos+2] === start_b &&
			id.data[pixel_pos+3] === start_a
		);
	}

	function color_pixel(pixel_pos){
		id.data[pixel_pos+0] = fill_r;
		id.data[pixel_pos+1] = fill_g;
		id.data[pixel_pos+2] = fill_b;
		id.data[pixel_pos+3] = fill_a;
	}
}

function apply_image_transformation(fn){
	// Apply an image transformation function to either the selection or the entire canvas
	var original_canvas = selection ? selection.source_canvas: canvas;
	
	var new_canvas = new Canvas(original_canvas.width, original_canvas.height);

	var original_ctx = original_canvas.getContext("2d");
	var new_ctx = new_canvas.getContext("2d");

	fn(original_canvas, original_ctx, new_canvas, new_ctx);
	
	if(selection){
		selection.replace_source_canvas(new_canvas);
	}else{
		undoable(0, function(){
			this_ones_a_frame_changer();
			
			ctx.copy(new_canvas);
			
			$canvas.trigger("update"); // update handles
		});
	}
}

function flip_horizontal(){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		new_ctx.translate(new_canvas.width, 0);
		new_ctx.scale(-1, 1);
		new_ctx.drawImage(original_canvas, 0, 0);
	});
}

function flip_vertical(){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		new_ctx.translate(0, new_canvas.height);
		new_ctx.scale(1, -1);
		new_ctx.drawImage(original_canvas, 0, 0);
	});
}

function rotate(angle){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		new_ctx.save();
		switch(angle){
			case TAU / 4:
			case TAU * -3/4:
				new_canvas.width = original_canvas.height;
				new_canvas.height = original_canvas.width;
				new_ctx.disable_image_smoothing();
				new_ctx.translate(new_canvas.width, 0);
				new_ctx.rotate(TAU / 4);
				break;
			case TAU / 2:
			case TAU / -2:
				new_ctx.translate(new_canvas.width, new_canvas.height);
				new_ctx.rotate(TAU / 2);
				break;
			case TAU * 3/4:
			case TAU / -4:
				new_canvas.width = original_canvas.height;
				new_canvas.height = original_canvas.width;
				new_ctx.disable_image_smoothing();
				new_ctx.translate(0, new_canvas.height);
				new_ctx.rotate(TAU / -4);
				break;
			default:
				var w = original_canvas.width;
				var h = original_canvas.height;
				
				var bb_min_x = +Infinity;
				var bb_max_x = -Infinity;
				var bb_min_y = +Infinity;
				var bb_max_y = -Infinity;
				var corner = function(x01, y01){
					var x = Math.sin(-angle)*h*x01 + Math.cos(+angle)*w*y01;
					var y = Math.sin(+angle)*w*y01 + Math.cos(-angle)*h*x01;
					bb_min_x = Math.min(bb_min_x, x);
					bb_max_x = Math.max(bb_max_x, x);
					bb_min_y = Math.min(bb_min_y, y);
					bb_max_y = Math.max(bb_max_y, y);
				};
				
				corner(0, 0);
				corner(0, 1);
				corner(1, 0);
				corner(1, 1);
				
				var bb_x = bb_min_x;
				var bb_y = bb_min_y;
				var bb_w = bb_max_x - bb_min_x;
				var bb_h = bb_max_y - bb_min_y;
				
				new_canvas.width = bb_w;
				new_canvas.height = bb_h;
				new_ctx.disable_image_smoothing();
				
				if(!transparency){
					new_ctx.fillStyle = colors.background;
					new_ctx.fillRect(0, 0, new_canvas.width, new_canvas.height);
				}
				
				new_ctx.translate(-bb_x,-bb_y);
				new_ctx.rotate(angle);
				new_ctx.drawImage(original_canvas, 0, 0, w, h);
				break;
		}
		new_ctx.drawImage(original_canvas, 0, 0);
		new_ctx.restore();
	});
}

function stretch_and_skew(xscale, yscale, hsa, vsa){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		var w = original_canvas.width * xscale;
		var h = original_canvas.height * yscale;
		
		var bb_min_x = +Infinity;
		var bb_max_x = -Infinity;
		var bb_min_y = +Infinity;
		var bb_max_y = -Infinity;
		var corner = function(x01, y01){
			var x = Math.tan(hsa)*h*x01 + w*y01;
			var y = Math.tan(vsa)*w*y01 + h*x01;
			bb_min_x = Math.min(bb_min_x, x);
			bb_max_x = Math.max(bb_max_x, x);
			bb_min_y = Math.min(bb_min_y, y);
			bb_max_y = Math.max(bb_max_y, y);
		};
		
		corner(0, 0);
		corner(0, 1);
		corner(1, 0);
		corner(1, 1);
		
		var bb_x = bb_min_x;
		var bb_y = bb_min_y;
		var bb_w = bb_max_x - bb_min_x;
		var bb_h = bb_max_y - bb_min_y;
		
		new_canvas.width = bb_w;
		new_canvas.height = bb_h;
		new_ctx.disable_image_smoothing();
		
		if(!transparency){
			new_ctx.fillStyle = colors.background;
			new_ctx.fillRect(0, 0, new_canvas.width, new_canvas.height);
		}
		
		new_ctx.save();
		new_ctx.transform(
			1, // x scale
			Math.tan(vsa), // vertical skew (skewY)
			Math.tan(hsa), // horizontal skew (skewX)
			1, // y scale
			-bb_x, // x translation
			-bb_y // y translation
		);
		new_ctx.drawImage(original_canvas, 0, 0, w, h);
		new_ctx.restore();
	});
}

function replace_colors_with_swatch(ctx, swatch, x_offset_from_global_canvas, y_offset_from_global_canvas){
	// mainly for patterns support (for black & white mode)
	ctx.globalCompositeOperation = "source-in";
	ctx.fillStyle = swatch;
	ctx.beginPath();
	ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();
	ctx.translate(-x_offset_from_global_canvas, -y_offset_from_global_canvas);
	ctx.fill();
	ctx.restore();
}

/*
function alpha_threshold(ctx, threshold){
	var id = ctx.getImageData(0, 0, canvas.width, canvas.height);

	for(var i=0; i<id.data.length; i+=4){
		if(id.data[i+3] < threshold){
			id.data[i+3] = 0;
		}
	}

	ctx.putImageData(id, 0, 0);
}
*/

// adapted from https://github.com/Pomax/bezierjs
function compute_bezier(t, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y){
	// TODO: get rid of this array of objects construction
	var p = [{x: start_x, y: start_y}, {x: control_1_x, y: control_1_y}, {x: control_2_x, y: control_2_y}, {x: end_x, y: end_y}];
	var mt = 1-t;
	var mt2 = mt*mt;
	var t2 = t*t;
	var a, b, c, d = 0;
	// if(this.order===2) {
	// 	p = [p[0], p[1], p[2], {x: 0, y: 0}];
	// 	a = mt2;
	// 	b = mt*t*2;
	// 	c = t2;
	// }
	// else if(this.order===3) {
	a = mt2*mt;
	b = mt2*t*3;
	c = mt*t2*3;
	d = t*t2;
	// }
	return {
		x: a*p[0].x + b*p[1].x + c*p[2].x + d*p[3].x,
		y: a*p[0].y + b*p[1].y + c*p[2].y + d*p[3].y
	};
}

function draw_bezier_curve(ctx, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y, stroke_size) {
	update_brush_for_drawing_lines(stroke_size);
	var steps = 100;
	var point_a = {x: start_x, y: start_y};
	for(var t=0; t<1; t+=1/steps){
		var point_b = compute_bezier(t, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y);
		draw_line(ctx, point_a.x, point_a.y, point_b.x, point_b.y, stroke_size);
		point_a = point_b;
	}
};
function draw_quadratic_curve(ctx, start_x, start_y, control_x, control_y, end_x, end_y, stroke_size) {
	draw_bezier_curve(ctx, start_x, start_y, control_x, control_y, control_x, control_y, end_x, end_y, stroke_size);
};

(function(){

	var tessy = (function initTesselator() {
		// function called for each vertex of tesselator output
		function vertexCallback(data, polyVertArray) {
			// console.log(data[0], data[1]);
			polyVertArray[polyVertArray.length] = data[0];
			polyVertArray[polyVertArray.length] = data[1];
		}
		function begincallback(type) {
			if (type !== libtess.primitiveType.GL_TRIANGLES) {
				console.log('expected TRIANGLES but got type: ' + type);
			}
		}
		function errorcallback(errno) {
			console.log('error callback');
			console.log('error number: ' + errno);
		}
		// callback for when segments intersect and must be split
		function combinecallback(coords, data, weight) {
			// console.log('combine callback');
			return [coords[0], coords[1], coords[2]];
		}
		function edgeCallback(flag) {
			// don't really care about the flag, but need no-strip/no-fan behavior
			// console.log('edge flag: ' + flag);
		}

		var tessy = new libtess.GluTesselator();
		// tessy.gluTessProperty(libtess.gluEnum.GLU_TESS_WINDING_RULE, libtess.windingRule.GLU_TESS_WINDING_POSITIVE);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, vertexCallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, begincallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, errorcallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, combinecallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, edgeCallback);

		return tessy;
	})();

	function triangulate(contours) {
		// libtess will take 3d verts and flatten to a plane for tesselation
		// since only doing 2d tesselation here, provide z=1 normal to skip
		// iterating over verts only to get the same answer.
		tessy.gluTessNormal(0, 0, 1);

		var triangleVerts = [];
		tessy.gluTessBeginPolygon(triangleVerts);

		for (var i = 0; i < contours.length; i++) {
			tessy.gluTessBeginContour();
			var contour = contours[i];
			for (var j = 0; j < contour.length; j += 2) {
				var coords = [contour[j], contour[j + 1], 0];
				tessy.gluTessVertex(coords, coords);
			}
			tessy.gluTessEndContour();
		}

		tessy.gluTessEndPolygon();

		return triangleVerts;
	}


	var gl;
	var positionLoc;

	function initWebGL(canvas) {
		gl = canvas.getContext('webgl', { antialias: false });

		var program = createShaderProgram();
		positionLoc = gl.getAttribLocation(program, 'position');
		gl.enableVertexAttribArray(positionLoc);
	}

	function initArrayBuffer(triangleVertexCoords) {
		// put triangle coordinates into a WebGL ArrayBuffer and bind to
		// shader's 'position' attribute variable
		var rawData = new Float32Array(triangleVertexCoords);
		var polygonArrayBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, polygonArrayBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, rawData, gl.STATIC_DRAW);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

		return triangleVertexCoords.length / 2;
	}

	function createShaderProgram() {
		// create vertex shader
		var vertexSrc = [
			'attribute vec4 position;',
			'void main() {',
			'    /* already in normalized coordinates, so just pass through */',
			'    gl_Position = position;',
			'}'
		].join('');
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShader, vertexSrc);
		gl.compileShader(vertexShader);

		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			console.log(
				'Vertex shader failed to compile. Log: ' +
				gl.getShaderInfoLog(vertexShader)
			);
		}

		// create fragment shader
		var fragmentSrc = [
			'precision mediump float;',
			'void main() {',
			'    gl_FragColor = vec4(0, 0, 0, 1);',
			'}'
		].join('');
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShader, fragmentSrc);
		gl.compileShader(fragmentShader);

		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			console.log(
				'Fragment shader failed to compile. Log: ' +
				gl.getShaderInfoLog(fragmentShader)
			);
		}

		// link shaders to create our program
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		gl.useProgram(program);

		return program;
	}


	var polygon_webgl_canvas = document.createElement('canvas');
	var polygon_canvas_2d = document.createElement('canvas');
	var polygon_ctx_2d = polygon_canvas_2d.getContext("2d");

	initWebGL(polygon_webgl_canvas);

	window.draw_line_strip = function(ctx, points){
		draw_polygon_or_line_strip(ctx, points, true, false, false);
	};
	window.draw_polygon = function(ctx, points, stroke, fill){
		draw_polygon_or_line_strip(ctx, points, stroke, fill, true);
	};

	function draw_polygon_or_line_strip(ctx, points, stroke, fill, close_path){
		var stroke_color = ctx.strokeStyle;
		var fill_color = ctx.fillStyle;

		var numPoints = points.length;
		var numCoords = numPoints * 2

		if(numPoints === 0){
			return;
		}

		var x_min = +Infinity;
		var x_max = -Infinity;
		var y_min = +Infinity;
		var y_max = -Infinity;
		for (var i = 0; i < numPoints; i++) {
			var {x, y} = points[i];
			x_min = Math.min(x, x_min);
			x_max = Math.max(x, x_max);
			y_min = Math.min(y, y_min);
			y_max = Math.max(y, y_max);
		}
		x_max += 1;
		y_max += 1;

		polygon_webgl_canvas.width = x_max - x_min;
		polygon_webgl_canvas.height = y_max - y_min;
		gl.viewport(0, 0, polygon_webgl_canvas.width, polygon_webgl_canvas.height);

		var coords = new Float32Array(numCoords);
		for (var i = 0; i < numPoints; i++) {
			coords[i*2+0] = (points[i].x - x_min) / polygon_webgl_canvas.width * 2 - 1;
			coords[i*2+1] = 1 - (points[i].y - y_min) / polygon_webgl_canvas.height * 2;
			// TODO: investigate: does this cause resolution/information loss? can we change the coordinate system?
		}

		if(fill){
			var contours = [coords];
			var polyTriangles = triangulate(contours);
			var numVertices = initArrayBuffer(polyTriangles);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, numVertices);

			polygon_canvas_2d.width = polygon_webgl_canvas.width;
			polygon_canvas_2d.height = polygon_webgl_canvas.height;

			polygon_ctx_2d.drawImage(polygon_webgl_canvas, 0, 0);
			replace_colors_with_swatch(polygon_ctx_2d, fill_color, x_min, y_min);
			ctx.drawImage(polygon_canvas_2d, x_min, y_min);
		}
		if(stroke){
			if(stroke_size > 1){
				var polygon_stroke_margin = ~~(stroke_size * 1.1);

				polygon_canvas_2d.width = x_max - x_min + polygon_stroke_margin * 2;
				polygon_canvas_2d.height = y_max - y_min + polygon_stroke_margin * 2;

				update_brush_for_drawing_lines(stroke_size);
				for (var i = 0; i < numPoints - (close_path ? 0 : 1); i++) {
					var point_a = points[i];
					var point_b = points[(i + 1) % numPoints];
					draw_line(
						polygon_ctx_2d,
						point_a.x - x_min + polygon_stroke_margin,
						point_a.y - y_min + polygon_stroke_margin,
						point_b.x - x_min + polygon_stroke_margin,
						point_b.y - y_min + polygon_stroke_margin,
						stroke_size
					)
				}

				var x = x_min - polygon_stroke_margin;
				var y = y_min - polygon_stroke_margin;
				replace_colors_with_swatch(polygon_ctx_2d, stroke_color, x, y);
				ctx.drawImage(polygon_canvas_2d, x, y);
			}else{
				var numVertices = initArrayBuffer(coords);
				gl.clear(gl.COLOR_BUFFER_BIT);
				gl.drawArrays(close_path ? gl.LINE_LOOP : gl.LINE_STRIP, 0, numVertices);

				polygon_canvas_2d.width = polygon_webgl_canvas.width;
				polygon_canvas_2d.height = polygon_webgl_canvas.height;

				polygon_ctx_2d.drawImage(polygon_webgl_canvas, 0, 0);
				replace_colors_with_swatch(polygon_ctx_2d, stroke_color, x_min, y_min);
				ctx.drawImage(polygon_canvas_2d, x_min, y_min);
			}
		}
	};

	window.copy_contents_within_polygon = function(canvas, points, x_min, y_min, x_max, y_max){
		// Copy the contents of the given canvas within the polygon given by points bounded by x/y_min/max
		x_max = Math.max(x_max, x_min + 1);
		y_max = Math.max(y_max, y_min + 1);
		var width = x_max - x_min;
		var height = y_max - y_min;
		
		// TODO: maybe have the cutout only the width/height of the bounds
		// var cutout = new Canvas(width, height);
		var cutout = new Canvas(canvas);

		cutout.ctx.save();
		cutout.ctx.globalCompositeOperation = "destination-in";
		draw_polygon(cutout.ctx, points, false, true);
		cutout.ctx.restore();
		
		var cutout_crop = new Canvas(width, height);
		cutout_crop.ctx.drawImage(cutout, x_min, y_min, width, height, 0, 0, width, height);

		return cutout_crop;
	}

})();
