pv.Layout.radial = function(map) {
  var nodes, sort;

  /** @private */
  function size(n) {
    return n.size = n.firstChild ? (1 + pv.sum(n.childNodes, size)) : 1;
  }

  /** @private */
  function depth(n) {
    return n.firstChild ? (1 + pv.max(n.childNodes, depth)) : 0;
  }

  /** @private */
  function divide(n) {
    var startAngle = n.startAngle;
    for (var c = n.firstChild; c; c = c.nextSibling) {
      var angle = (c.size / (n.size - 1)) * n.angle;
      c.startAngle = startAngle;
      c.angle = angle;
      c.midAngle = startAngle + angle / 2;
      startAngle += angle;
      divide(c);
    }
  }

  /** @private */
  function data() {
    if (nodes) return nodes;
    nodes = pv.dom(map).nodes();

    var root = nodes[0];
    root.startAngle = -Math.PI / 2;
    root.midAngle = 0;
    root.angle = 2 * Math.PI;
    size(root);
    if (sort) root.sort(sort);
    divide(root);

    /* Compute the radius and position. */
    var w = this.parent.width() / 2,
        h = this.parent.height() / 2,
        r = Math.min(w, h) / depth(root);
    root.visitAfter(function(n, i) {
        var d = r * i;
        n.x = w + d * Math.cos(n.midAngle);
        n.y = h + d * Math.sin(n.midAngle);
      });

    return nodes;
  }

  var layout = {};

  layout.nodes = data;

  layout.links = function() {
    return data.call(this)
        .filter(function(n) { return n.parentNode; })
        .map(function(n) { return [n, n.parentNode]; });
  };

  layout.sort = function(f) {
    sort = f;
    return this;
  };

  /* A dummy mark, like an anchor, which the caller extends. */
  layout.node = new pv.Mark()
      .data(data)
      .strokeStyle("#1f77b4")
      .fillStyle("white")
      .left(function(n) { return n.x; })
      .top(function(n) { return n.y; });

  /* A dummy mark, like an anchor, which the caller extends. */
  layout.link = new pv.Mark().extend(layout.node)
      .data(pv.identity)
      .fillStyle(null)
      .strokeStyle("#ccc");

  /* A dummy mark, like an anchor, which the caller extends. */
  layout.label = new pv.Mark().extend(layout.node)
      .textAngle(function(n) {
          var a = n.midAngle;
          return pv.Wedge.upright(a) ? a : (a + Math.PI);
        })
      .textMargin(7)
      .textBaseline("middle")
      .textAlign(function(n) {
          return pv.Wedge.upright(n.midAngle) ? "left" : "right";
        })
      .text(function(n) { return n.parentNode ? n.nodeName : "root"; });

  return layout;
};
