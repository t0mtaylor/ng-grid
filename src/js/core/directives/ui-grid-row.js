(function(){
  'use strict';

  angular.module('ui.grid').directive('uiGridRow', ['$log', function($log) {
    return {
      replace: true,
      // priority: 2001,
      // templateUrl: 'ui-grid/ui-grid-row',
      require: '^uiGrid',
      scope: {
         row: '=uiGridRow',
         rowIndex: '='
      },
      compile: function() {
        return {
          pre: function($scope, $elm, $attrs, uiGridCtrl) {
            var grid = uiGridCtrl.grid;

            grid.getRowTemplateFn.then(function (templateFn) {
              templateFn($scope, function(clonedElement, scope) {
                $elm.replaceWith(clonedElement);
              });
            });
          },
          post: function($scope, $elm, $attrs, uiGridCtrl) {
            $scope.grid = uiGridCtrl.grid;

            //add optional reference to externalScopes function to scope
            //so it can be retrieved in lower elements
            $scope.getExternalScopes = uiGridCtrl.getExternalScopes;
            $scope.getCellValue = uiGridCtrl.getCellValue;



            $scope.rowStyle = function (renderedRowIndex) {
              //todo: for whatever reason, $index is not coming through on the directive
              //using $parent.$index for now and it works
             return uiGridCtrl.rowStyle($scope.$parent.$index);
            };

          }
        };
      }
    };
  }]);

})();