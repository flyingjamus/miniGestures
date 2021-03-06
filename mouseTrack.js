/*
 *  Copyright (C) 2013  AJ Ribeiro
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.   
 */


/** @namespace chrome.extension */
/* global chrome, console */
(function() {
  "use strict";

  var rmousedown = false, moved = false, lmousedown = false;
  var rocker = false, trail = false;
  var mx, my, nx, ny, lx, ly, phi;
  var move = "", omove = "";
  var pi = 3.14159;
  var suppress = 1;
  var canvas, myGests, ginv;
  var myColor = "red", myWidth = 3;
  var loaded = false;
  var rocked = false;
  var link;

  function invertHash(hash) {
    var inv = {};
    for (var key in hash) {
      if (hash.hasOwnProperty(key)) {
        inv[hash[key]] = key;
      }
    }
    return inv;
  }

  function createCanvas() {
    var canvas = document.createElement('canvas');
    canvas.id = "gestCanvas";
    canvas.style.width = document.body.scrollWidth;
    canvas.style.height = document.body.scrollHeight;
    canvas.width = window.document.body.scrollWidth;
    canvas.height = window.document.body.scrollHeight;
    canvas.style.left = "0px";
    canvas.style.top = "0px";
    canvas.style.overflow = 'visible';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = "10000";
    return canvas;
  }

  function clearAndRemoveCanvas() {
    if (canvas) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      document.body.removeChild(canvas);
    }
  }

  function draw(x, y) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = myColor;
    ctx.lineWidth = myWidth;
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    lx = x;
    ly = y;
  }

  document.onmousedown = function(event) {
    if (event.which === 1) {
      lmousedown = true;
    }
    else if (event.which === 3) {
      rmousedown = true;
    }

    //leftrock
    if (event.which === 1 && rmousedown && suppress && rocker) {
      if (!loaded) {
        loadOptions();
        loaded = true;
      }
      move = 'back';
      rocked = true;
      // console.log(rocked)
      exeRock();
    }

    // console.log('rmousedown '+suppress)
    //right mouse click
    else if (event.which === 3 && suppress) {
      if (!loaded) {
        loadOptions();
        loaded = true;
      }
      if (lmousedown && rocker) {
        if (!loaded) {
          loadOptions();
          loaded = true;
        }
        move = 'forward';
        rocked = true;
        // console.log(rocked)
        exeRock();
      }
      else {
        my = event.pageX;
        mx = event.pageY;
        lx = my;
        ly = mx;
        move = "";
        omove = "";
        moved = false;
        if (event.target.href) {
          link = event.target.href;
        } else if (event.target.parentElement.href) {
          link = event.target.parentElement.href;
        } else {
          link = null;
        }
      }
    }

  };

  document.onmousemove = function(event) {
    //track the mouse if we are holding the right button
    if (rmousedown) {
      ny = event.pageX;
      nx = event.pageY;
      var r = Math.sqrt(Math.pow(nx - mx, 2) + Math.pow(ny - my, 2));
      if (r > 16) {
        var tmove;
        phi = Math.atan2(ny - my, nx - mx);
        if (phi < 0) {
          phi += 2.0 * pi;
        }
        if (phi >= pi / 4.0 && phi < 3.0 * pi / 4.0) {
          tmove = "R";
        } else if (phi >= 3.0 * pi / 4.0 && phi < 5.0 * pi / 4.0) {
          tmove = "U";
        } else if (phi >= 5.0 * pi / 4.0 && phi < 7.0 * pi / 4.0) {
          tmove = "L";
        } else if (phi >= 7.0 * pi / 4.0 || phi < pi / 4.0) {
          tmove = "D";
        }
        if (tmove !== omove) {
          move += tmove;
          omove = tmove;
        }
        if (!moved && trail) {
          // console.log('making canvas')
          if (!canvas) {
            canvas = createCanvas();
          }
          document.body.appendChild(canvas);
        }
        moved = true;
        //console.log('indraw' + trail);

        if (trail) {
          //console.log('draw');
          draw(ny, nx);
        }

        mx = nx;
        my = ny;
      }
    }
  };


  document.onmouseup = function(event) {
    // console.log('mouse is up '+suppress)
    if (event.which === 1) {
      lmousedown = false;
    }

    //right mouse release
    if (event.which === 3) {
      // console.log('suppress is '+suppress)
      rmousedown = false;
      if (moved) {
        clearAndRemoveCanvas();
        exeFunc();
      } else if (rocked) {
        rocked = false;
      } else {
        --suppress;
        // console.log('no move '+suppress)
        //$('#target').rmousedown(which=3);
      }
    }
  };
  function exeRock() {
    if (move === "back") {
      window.history.back();
    } else if (move === "forward") {
      window.history.forward();
    }
  }

  function exeFunc() {
    // console.log('exeFunc '+move)
    if (ginv[move]) {
      var action = ginv[move];
      if (action === "back") {
        window.history.back();
      } else if (action === "forward") {
        window.history.forward();
      } else if (action === "newtab") {
        if (link) {
          window.open(link);
        } else {
          chrome.extension.sendMessage({ msg: "newtab" },
            function(response) {
              if (!response) {
                console.log('problem executing open tab');
                /** @namespace chrome.extension.lastError */
                if (chrome.extension.lastError) {
                  console.log(chrome.extension.lastError.message);
                }
              }
            });
        }
      } else if (action === "closetab") {
        chrome.extension.sendMessage({ msg: "closetab" });
      } else if (action === "lasttab") {
        chrome.extension.sendMessage({ msg: "lasttab" });
      } else if (action === "reloadall") {
        chrome.extension.sendMessage({ msg: "reloadall" });
      } else if (action === "closeall") {
        chrome.extension.sendMessage({ msg: "closeall" });
      } else if (action === "nexttab") {
        chrome.extension.sendMessage({ msg: "nexttab" });
      } else if (action === "prevtab") {
        chrome.extension.sendMessage({ msg: "prevtab" });
      } else if (action === "closeback") {
        chrome.extension.sendMessage({ msg: "closeback" });
      } else if (action === "scrolltop") {
        window.scrollTo(0, 0);
      } else if (action === "scrollbottom") {
        window.scrollTo(0, document.body.scrollHeight);
      } else if (action === "reload") {
        window.location.reload();
      } else if (action === "stop") {
        window.stop();
      }
    }
  }


  document.oncontextmenu = function() {
    // console.log('ctx menu suppress is '+suppress)

    if (suppress) {
      return false;
    } else {
      // console.log("open it");
      suppress++;
      return true;
    }
  };

  function loadOptions() {
    chrome.extension.sendMessage({ msg: "colorCode" },
      function(response) {
        if (response) {
          // console.log('color'+response.resp)
          myColor = response.resp;
        }
        // else
        //     console.log('error getting colorCode')
      });
    chrome.extension.sendMessage({ msg: "width" },
      function(response) {
        if (response) {
          myWidth = response.resp;
          // console.log('width '+myWidth)
        }
        // else
        //     console.log('error getting width')
      });
    chrome.extension.sendMessage({ msg: "gests" },
      function(response) {
        if (response) {
          myGests = response.resp;
          ginv = invertHash(myGests);
        }
      });

    chrome.extension.sendMessage({ msg: "rocker" },
      function(response) {
        if (response) {
          rocker = response.resp === 'true';
        }
      });

    chrome.extension.sendMessage({ msg: "trail" },
      function(response) {
        if (response) {
          trail = response.resp === 'true';
        }
      });
  }

  document.addEventListener('DOMContentLoaded', loadOptions);

})();
