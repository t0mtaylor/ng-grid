describe('ui.grid.colPinning GridRowDirective', function () {
  var gridUtil;
  var scope;
  var element;
  var uiGridConstants;
  var recompile;
  var $timeout;

  beforeEach(module('ui.grid.colPinning'));

  beforeEach(inject(function ($rootScope, $compile, $controller, _gridUtil_, $templateCache, gridClassFactory,
                              uiGridColPinningService, _uiGridConstants_, _$timeout_) {
    gridUtil = _gridUtil_;
    uiGridConstants = _uiGridConstants_;
    $timeout = _$timeout_;

    $templateCache.put('ui-grid/uiGridRow', '<div></div>');
    $templateCache.put('ui-grid/pinnedLeftCols', '<div></div>');

    scope = $rootScope.$new();
    var grid = gridClassFactory.createGrid();
    grid.options.columnDefs = [
      {name: 'col1', pinnedLeft: true}
    ];
    grid.options.data = [
      {col1: 'val'}
    ];
    grid.registerColumnBuilder(uiGridColPinningService.columnBuilder);
    grid.buildColumns();
    grid.modifyRows(grid.options.data);

    scope.grid = grid;
    scope.col = grid.columns[0];
    scope.row = grid.rows[0];

    scope.getCellValue = function(row,col){return 'val';};

    recompile = function () {
      $compile(element)(scope);
      $rootScope.$digest();
    };
  }));

  describe('ui.grid.edit uiGridCell start editing', function () {
    var displayHtml;
    beforeEach(function () {
      element = angular.element('<div ui-grid-row/>');
      var controller = element.controller('ui-grid-row');

      //spyOn(controller, 'grid').andReturn(scope.grid);

      recompile();

      displayHtml = element.html();
      expect(element.text()).toBe('val');
    });

    it('startEdit on "a"', function () {
      //stop edit
      var event = jQuery.Event("keydown");
      event.keyCode = 65;
      element.trigger(event);
      expect(element.find('input')).toBeDefined();
    });

    it('not start edit on tab', function () {
      //stop edit
      var event = jQuery.Event("keydown");
      event.keyCode = uiGridConstants.keymap.TAB;
      element.trigger(event);
      expect(element.html()).toEqual(displayHtml);
    });

  });


});