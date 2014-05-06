(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @name ui.grid.colPinning
   * @description
   *
   *  # ui.grid.colPinning
   * This module provides column pinning capability.  You can pin a column to the left or right.
   *
   * <div doc-module-components="ui.grid.colPinning"></div>
   */

  var module = angular.module('ui.grid.colPinning', ['ui.grid']);

  /**
   *  @ngdoc object
   *  @name ui.grid.colPinning.constant:colPinningConstants
   *
   *  @description constants available in edit module
   */
  module.constant('colPinningConstants', {
    //must be lowercase because template bulder converts to lower
    PINNED_LEFT_COLS_TEMPLATE: 'ui-grid/pinnedLeftCols',
    PINNED_LEFT_COLS_HEADER_TEMPLATE: 'ui-grid/pinnedLeftColsHeader'
  });

  /**
   *  @ngdoc service
   *  @name ui.grid.colPinning.service:uiGridColPinningService
   *
   *  @description Services for column pinning
   */
  module.service('uiGridColPinningService', ['$log', '$q', '$templateCache', 'uiGridConstants',
    function ($log, $q, $templateCache, uiGridConstants) {

      var service = {

        /**
         * @ngdoc service
         * @name columnBuilder
         * @methodOf ui.grid.colPinning.service:uiGridColPinningService
         * @description columnBuilder function that adds column pinning properties to grid column
         * @returns {promise} promise that will load any needed templates when resolved
         */
        columnBuilder: function (colDef, col, gridOptions) {
          //initialize pinnedLeftCols on grid
          if (!this.pinnedLeftCols) {
            this.pinnedLeftCols = [];
          }
          if (!this.pinnedRightCols) {
            this.pinnedRightCols = [];
          }

          var promises = [];

          col.pinnedLeft = colDef.pinnedLeft !== undefined ?
            colDef.pinnedLeft : false;

          col.pinnedRight = colDef.pinnedRight !== undefined ?
            colDef.pinnedRight : false;


          if (col.pinnedLeft) {
            service.pinLeft(this, col);
          }

          if (col.pinnedRight) {
            service.pinRight(this, col);
          }


          return $q.all(promises);
        },

        /**
         * @ngdoc service
         * @name rowTemplateProcessor
         * @methodOf ui.grid.colPinning.service:uiGridColPinningService
         * @description adds pinning directives to row template
         * @returns {promise} promise that will load any needed templates when resolved
          */
        rowTemplateProcessor: function (rowTemplate, gridOptions) {
          var elm = angular.element(rowTemplate);
          var deferred = $q.defer();
          //assume we need to start after first div
          elm.prepend(angular.element('<div ui-grid-pinned-cols-left/>'));

          deferred.resolve(elm.html());

          return deferred.promise;
        },

        pinLeft: function (grid, col) {
          if(grid.pinnedLeftCols.indexOf(col) === -1){
            grid.pinnedLeftCols.push(col);
          }
          col.renderable = false;
        },

        pinRight: function (grid, col) {
          if(grid.pinnedRightCols.indexOf(col) === -1){
             grid.pinnedRightCols.push(col);
          }
          col.renderable = false;
        }
      };


      return service;

    }]);

  /**
   *  @ngdoc directive
   *  @name ui.grid.colPinning.directive:uiGridColPinning
   *  @element div
   *  @restrict EA
   *
   *  @description Adds Column Pinning to the ui-grid directive.
   *
   *  @example
   <example module="app">
   <file name="app.js">
   var app = angular.module('app', ['ui.grid', 'ui.grid.colPinning']);

   app.controller('MainCtrl', ['$scope', function ($scope) {
      $scope.data = [
        { name: 'Bob', title: 'CEO' },
            { name: 'Frank', title: 'Lowly Developer' }
      ];

      $scope.columnDefs = [
        {name: 'name', pinnedLeft: true},
        {name: 'title', pinnedRight: true}
      ];
    }]);
   </file>
   <file name="index.html">
   <div ng-controller="MainCtrl">
   <div ui-grid="{ data: data, columnDefs: columnDefs }" ui-grid-col-pinning></div>
   </div>
   </file>
   </example>
   */
  module.directive('uiGridColPinning', ['$log', 'uiGridColPinningService', function ($log, uiGridColPinningService) {
    return {
      replace: true,
      priority: 0,
      require: '^uiGrid',
      scope: false,
      compile: function () {
        return {
          pre: function ($scope, $elm, $attrs, uiGridCtrl) {
            uiGridCtrl.grid.registerColumnBuilder(uiGridColPinningService.columnBuilder);
            uiGridCtrl.grid.registerRowTemplateProcessor(uiGridColPinningService.rowTemplateProcessor);
          },
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
          }
        };
      }
    };
  }]);

  /**
   * stacks on top of core uiGridHeader
   */
  module.directive('uiGridHeader', ['$log', '$templateCache', 'colPinningConstants',
    function($log, $templateCache, colPinningConstants) {
      return {
        priority: -100, //run after default grid header
        require: '^uiGrid',
        compile: function($elm) {
          $elm.prepend(angular.element('<div ui-grid-pinned-cols-left-header/>'));
          return {
            pre: function($scope, $elm, $attrs) {

            },
            post: function($scope, $elm, $attrs, uiGridCtrl) {
            }
          };
        }
      };
    }]);

  module.directive('uiGridBody', ['$log', '$templateCache', 'colPinningConstants',
    function($log, $templateCache, colPinningConstants) {
    return {
      priority: 1000, //run before default body (post link will then run After) so we can override functions
      require: '^uiGrid',
      compile: function($elm) {

        return {
          pre: function($scope, $elm, $attrs) {

          },
          post: function($scope, $elm, $attrs, uiGridCtrl) {


            //override gridBody function
            uiGridCtrl.updateColumnOffset = function() {
              // Calculate the width of the columns on the left side that are no longer rendered.
              //  That will be the offset for the columns as we scroll horizontally.
              var hiddenColumnsWidth = 0;
              for (var i = 0; i < uiGridCtrl.currentFirstColumn; i++) {
                hiddenColumnsWidth += $scope.grid.renderableColumns[i].drawnWidth;
              }

              var pinnedLeftColsWidth  = 0;
              uiGridCtrl.grid.pinnedLeftCols.forEach(function(col){
                 pinnedLeftColsWidth += col.drawnWidth;
              });

              uiGridCtrl.columnOffset = hiddenColumnsWidth + pinnedLeftColsWidth;
            };

            //override uiGridCtrl.rowStyle
            uiGridCtrl.rowStyle = function (renderedRowIndex) {
              var styles = {};

              if (renderedRowIndex === 0 && uiGridCtrl.currentTopRow !== 0) {
                // The row offset-top is just the height of the rows above the current top-most row, which are no longer rendered
                var hiddenRowWidth = (uiGridCtrl.currentTopRow) * uiGridCtrl.grid.options.rowHeight;

                // return { 'margin-top': hiddenRowWidth + 'px' };
                styles['margin-top'] = hiddenRowWidth + 'px';
              }

              styles['margin-left'] = uiGridCtrl.columnOffset + 'px';

              return styles;
            };

            //override gridBody function
            $scope.columnStyle = function (index) {
              if (index === 0 && uiGridCtrl.currentFirstColumn !== 0) {
                var offset = uiGridCtrl.columnOffset;
               // if()

                return { 'margin-left': offset + 'px' };
              }

              return null;
            };


          }
        };
      }
    };
  }]);

  module.directive('uiGridRow', ['$log', '$templateCache', 'colPinningConstants',
    function($log, $templateCache, colPinningConstants) {
      return {
        priority: 100,
        require: '^uiGrid',
        compile: function() {

          return {
            pre: function($scope, $elm, $attrs) {

            },
            post: function($scope, $elm, $attrs, uiGridCtrl) {

            }
          };
        }
      };
    }]);


  module.directive('uiGridPinnedColsLeftHeader', ['$log', '$templateCache', 'colPinningConstants',
    function($log, $templateCache, colPinningConstants) {
      return {
        replace: true,
        priority: 0,
        templateUrl: colPinningConstants.PINNED_LEFT_COLS_HEADER_TEMPLATE,
        require: '^uiGrid',
        compile: function($elm) {
          return {
            pre: function($scope, $elm, $attrs) {

            },
            post: function($scope, $elm, $attrs, uiGridCtrl) {


            }
          };
        }
      };
    }]);

  module.directive('uiGridPinnedColsLeft', ['$log', '$templateCache', 'colPinningConstants',
    function($log, $templateCache, colPinningConstants) {
      return {
        replace: true,
        priority: 0,
        templateUrl: colPinningConstants.PINNED_LEFT_COLS_TEMPLATE,
        require: '^uiGrid',
        compile: function($elm) {
          return {
            pre: function($scope, $elm, $attrs) {

            },
            post: function($scope, $elm, $attrs, uiGridCtrl) {
              $scope.pinnedLeftStyle = function() {
                return { 'left': uiGridCtrl.grid.options.offsetLeft + 'px'};
              };

            }
          };
        }
      };
    }]);
})();