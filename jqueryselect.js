/*
[
  {
    id:1,
    name:"test1",
    openChildren:true,
    children:[
      {
        id:11,
        name:"test11",
        isChecked:false,
        openChildren:true,
        children:[]
      },
      {
        id:12,
        name:"test12",
        isChecked:true,
        openChildren:false,
        children:[]
      }
    ]
  }
]
*/

;(function($, window, document,undefined) {
    var panelClassName = "TC-jquery-select";
    var panelClass = "." + panelClassName;
    var noDataTemp = '<p class="noData">哎呀，没找到，换个试试吧～</p>';
    var JquerySelect = function(ele, opt) {
        this.$element = ele,
        this.defaults = {
          "multi":false,      //是否多选
          "tree":false,       //是否树状
          "search":true,      //是否需要搜索框
          "placeholder":"",   //placeholder
          "dataJson":[],      //非异步的数据源
          "checkFn":null,     //点击复选框回调
          "hideFn":null       //选择完成隐藏面板时回调
        },
        this.options = $.extend({}, this.defaults, opt)
    }

    JquerySelect.prototype = {
        initDOM: function() {
          //初始化组件头部元素
          var options = this.options;
          if(this.$element.hasClass(panelClassName)){
            return;
          }
          this.$element.addClass(panelClassName);
          var domObj = $('<div class="tcSelectShower"></div>\
                          <div class="tcSelectPanel">\
                            <div class="tcSelectFilter">\
                              <input class="tcSelectFilterInput" type="text" placeholder="' + options.placeholder + '">\
                              <span class="clearInput">&Chi;</span>\
                            </div>\
                            <ul class="tcSelectList"></ul>\
                          </div>');
          if(!options.search){
              domObj.find(".tcSelectFilter").remove();
          }
          this.$element.append(domObj);
          this.$element.find(".tcSelectShower").css("line-height",this.$element.height() + "px");

          //点击空白区域关闭面板
          $(document).click(function(e){
              var obj = $(e.target);
              if(obj.parents(panelClass).length == 0){
                  $(".tcSelectPanel").slideUp(200);

              }
          });

          initList(this);
          bindEvent(this);
        },
        destroy:function(){
          this.$element.removeClass(panelClassName).empty();
        },
        setDefaultValue:function(txt,dataObj){

        }
    }

    //判断数组类型
    function initList(obj){
      obj.$element.find(".tcSelectShower").empty();
      var listWrapper = obj.$element.find(".tcSelectList");
      var options = obj.options;
      var dataJson = options.dataJson;
      if(dataJson.length == 0){
        listWrapper.html(noDataTemp);
        return;
      }
      var isTree = options.tree;
      if(isTree){
        initTreeList(obj,dataJson,listWrapper);
      } else {
        initNomalList(obj,dataJson,listWrapper);
      }
      initShowerData(obj);
    }

    //拼接普通数组面板
    function initNomalList(obj,data,wrapper){
      if(data.length == 0){
        wrapper.html(noDataTemp);
        return;
      }
      for(var listIndex in data){
        var dataItem = data[listIndex];
        var checkBoxClass = dataItem.isChecked ? "checkBox checked" : "checkBox";

        var listItem = $('<li class="tcSelectItem">\
                          <i class="' + checkBoxClass + '"></i>\
                          <span data-id="' + dataItem.id + '">' + dataItem.name + '</span>\
                        </li>');
        if(!obj.options.multi){
          listItem.find(".checkBox").remove();
        }
        if(dataItem.data){
          listItem.children("span").data("data",dataItem.data);
        }
        wrapper.append(listItem);
      }
    }

    //拼接树状面板
    function initTreeList(obj,data,wrapper){
      for(var index in data){
        var dataItem = data[index];
        var checkBoxClass = dataItem.isChecked && (!dataItem.children || dataItem.children.length == 0) ? "checkBox checked" : "checkBox";

        var itemObj = $('<li class="tcSelectItem">\
                              <i class="treeLine"></i>\
                              <i class="' + checkBoxClass + '"></i>\
                              <span data-id="' + dataItem.id + '">' + dataItem.name + '</span>\
                              <ul></ul>\
                            </li>');
        if(dataItem.children && dataItem.children.length){
          itemObj.find(".treeLine").addClass("hasChildren");
        }
        if(!obj.options.multi){
          itemObj.find(".checkBox").remove();
        }
        if(dataItem.data){
          itemObj.children("span").data("data",dataItem.data);
        }
        wrapper.append(itemObj);
        setTreeCheckStatus(itemObj.find(".checkBox"));
        if(dataItem.children && dataItem.children.length){
          if(dataItem.openChildren){
            itemObj.find(".treeLine").addClass("open");
            itemObj.children("ul").slideDown(200);
          }
          initTreeList(obj,dataItem.children,itemObj.children("ul"));
        }
      }
    }

    function bindEvent(obj){
      var selectObj = obj.$element;
      var dataObj = {"obj":obj}
      selectObj.on("click",".tcSelectShower",dataObj,togglePanel);
      selectObj.on("click",".tcSelectItem",dataObj,clickItem);
      selectObj.on("click",".treeLine",dataObj,clickTreeLine);
      if(obj.options.search){
        selectObj.on("input",".tcSelectFilterInput",dataObj,inputFilter);
      }
    }

    function togglePanel(e){
      var obj = e.data.obj;
      var target = obj.$element.find(".tcSelectPanel");
      $(".TC-jquery-select .tcSelectPanel").not(target).slideUp();
      target.slideToggle();
    }

    //设置选中状态
    function clickItem(e){
      e.stopPropagation();
      if($(e.target).hasClass("treeLine")){
        return;
      }

      var obj = e.data.obj;
      obj.$element.find(".tcSelectShower").empty();
      if(obj.options.multi){
        var checkBox = $(this).children(".checkBox");
        if(checkBox.hasClass("checked")){
          checkBox.removeClass("checked");
        } else if(checkBox.hasClass("halfChecked")){
          checkBox.removeClass("halfChecked");
          checkBox.addClass("checked");
        } else {
          checkBox.addClass("checked");
        }
        if(e.data.obj.options.tree){
          setTreeCheckStatus(checkBox);
        }
        var ids = getCheckedIds(obj.$element.find(".tcSelectPanel"));
        resetDataJson(obj,null);
        initShowerData(obj);
        if(obj.options.checkFn){
          obj.options.checkFn(ids);
        }
      } else {
        var spanObj = $(this).children("span");
        resetDataJson(obj,spanObj.attr("data-id"));
        initShowerData(obj);
        obj.$element.find(".tcSelectPanel").slideUp(200);
        if(obj.options.checkFn){
          obj.options.checkFn([{"id":spanObj.attr("data-id"),"name":spanObj.text().trim(),"data":spanObj.data("data")}]);
        }
      }
    }

    //更新数据
    // function resetDataJson(obj,id,dataList){
    //   var dataJson = dataList || obj.options.dataJson;
    //   var listWrapper = obj.$element.find(".tcSelectList");
    //   for(var index in dataJson){
    //     var dataItem = dataJson[index];
    //     if(!dataItem.children || dataItem.children.length == 0){
    //       if(id){
    //         if(dataItem.id == id){
    //           dataItem.isChecked = true;
    //         } else {
    //           dataItem.isChecked = false;
    //         }
    //       } else {
    //         var targetSpan = listWrapper.find('span[data-id="' + dataItem.id + '"]');
    //         if(targetSpan.length){
    //           if(targetSpan.siblings(".checkBox").hasClass("checked")){
    //             dataItem.isChecked = true;
    //           } else {
    //             dataItem.isChecked = false;
    //           }
    //         }
    //       }
    //     } else {
    //       resetDataJson(obj,id,dataItem.children);
    //     }
    //   }
    // }

    //有id为单选
    function resetDataJson(obj,id,dataList){
      var dataJson = dataList || obj.options.dataJson;
      var listWrapper = obj.$element.find(".tcSelectList");
      for(var index in dataJson){
        var dataItem = dataJson[index];
        if(id){
          if(dataItem.id == id){
            dataItem.isChecked = true;
          } else {
            dataItem.isChecked = false;
          }
          if(dataItem.children && dataItem.children.length){
            resetDataJson(obj,id,dataItem.children);
          }
        } else {
          if(!dataItem.children || dataItem.children.length == 0){
            var targetSpan = listWrapper.find('span[data-id="' + dataItem.id + '"]');
            if(targetSpan.length){
              if(targetSpan.siblings(".checkBox").hasClass("checked")){
                dataItem.isChecked = true;
              } else {
                dataItem.isChecked = false;
              }
            }
          } else {
            resetDataJson(obj,id,dataItem.children);
          }
        }
      }
    }


    //设置选中数据显示
    function initShowerData(obj,dataList){
      var dataJson = dataList || obj.options.dataJson;
      var wrapper = obj.$element.find(".tcSelectShower");
      for(var index in dataJson){
        var dataItem = dataJson[index];
        if(obj.options.multi){
          if(!dataItem.children || dataItem.children.length == 0){
            if(dataItem.isChecked){
              wrapper.append('<span>' + dataItem.name + '</span>');
            }
          } else {
            initShowerData(obj,dataItem.children);
          }
        } else {
          if(dataItem.isChecked){
            wrapper.append('<span>' + dataItem.name + '</span>');
          } else if(dataItem.children && dataItem.children.length){
            initShowerData(obj,dataItem.children);
          }
        }

      }
    }

    function getCheckedIds(wrapper){
      var ids = [];
      wrapper.find(".tcSelectItem").each(function(){
        if($(this).find(".tcSelectItem").length == 0 && $(this).find(".checkBox").hasClass("checked")){
          var spanObj = $(this).children("span");
          ids.push({"id":spanObj.attr("data-id"),"name":spanObj.text().trim(),"data":spanObj.data("data")});
        }
      });
      return ids;
    }

    //每次复选框状态变化都需要重置整棵树的复选框状态
    function setTreeCheckStatus(checkBox){
      //保持所有子节点的复选框状态和当前节点状态一致
      var childrenItem = checkBox.siblings("ul").find(".checkBox");
      if(childrenItem && childrenItem.length){
        childrenItem.attr("class",checkBox.attr("class"));
      }
      setParentStatus(checkBox);
    }

    //设置父节点复选框状态
    function setParentStatus(checkBox){
      if(checkBox.parents(".tcSelectItem").length){
        var tcSelectItem = checkBox.parent();
        var parentItem = tcSelectItem.parent().parent();
        //根据选中数量和同级别节点数量对比以及同级别是否有半选中状态设置父节点状态
        var checkedLength = 0;
        var hasHalfChecked = false;
        var itemList = tcSelectItem.siblings(".tcSelectItem");
        itemList.push(tcSelectItem);

        itemList.each(function(){
          if($(this).children(".checkBox").hasClass("checked")){
            checkedLength ++;
          } else if($(this).children(".checkBox").hasClass("halfChecked")){
            hasHalfChecked = true;
          }
        });
        var parentCheckBox = parentItem.children(".checkBox");
        if(checkedLength == 0){
          parentCheckBox.attr("class","checkBox");
        } else if(checkedLength == tcSelectItem.siblings(".tcSelectItem").length + 1){
          parentCheckBox.attr("class","checkBox checked");
        } else {
          parentCheckBox.attr("class","checkBox halfChecked");
        }
        if(hasHalfChecked){
          parentCheckBox.attr("class","checkBox halfChecked");
        }
        setParentStatus(parentCheckBox);
      }
    }

    function clickTreeLine(e){
      //仅对有子节点的操作
      if($(this).hasClass("hasChildren")){
        //如果子节点已经存在则直接操作
        if($(this).siblings("ul").find("li").length){
          //关闭当前节点及所有子节点
          if($(this).hasClass("open")){
            $(this).parent().find("ul").slideUp();
            $(this).parent().find(".treeLine").removeClass("open");
          } else {
            //打开当前节点
            $(this).addClass("open");
            $(this).siblings("ul").slideDown();
          }
        }
      }
    }

    //输入关键字搜索
    function inputFilter(e){
      var obj = e.data.obj;
      resetList(obj,$(this).val().trim());
    }

    //重新拼接列表
    function resetList(obj,key){
      var element = obj.$element;
      var options = obj.options;
      var wrapper = element.find(".tcSelectList");
      if(options.dataJson && options.dataJson.length){
        var dataJson = options.dataJson;
        if(options.tree){
          var tempUL = $('<div class="tcSelectListTemp"></div>');
          initTreeList(obj,dataJson,tempUL);
          tempUL.find(".tcSelectItem").each(function(){
            var itemTxtObj = $(this).find("span");
            if(itemTxtObj.text().indexOf(key) == -1 && $(this).find(".tcSelectItem").children("span").text().indexOf(key) == -1){
                $(this).remove();
            }
          });
          if(tempUL.html().length){
            wrapper.html(tempUL.html());
          } else {
            wrapper.html("<p class='noData'>哎呀，什么都没找到～</p>");
          }
        } else {
          var resultData = [];
          for(var listIndex in dataJson){
            if(dataJson[listIndex].name.indexOf(key) != -1){
              resultData.push(dataJson[listIndex]);
            }
          }
          initNomalList(obj,resultData,wrapper.empty());
        }
      }
    }

    //清空输入框
    function clearInput(e){

    }

    $.fn.jquerySelect = function(options) {
        var jquerySelect = new JquerySelect(this, options);
        jquerySelect.initDOM();
        return jquerySelect;
    }
})(jQuery, window, document);
