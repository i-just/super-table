if (typeof Craft.SuperTable === typeof undefined) {
    Craft.SuperTable = {};
}

(function($) {

Craft.SuperTable.Input = Garnish.Base.extend({
    id: null,
    blockType: null,
    inputNamePrefix: null,

    totalNewBlocks: 0,

    sorter: null,

    $div: null,
    $divInner: null,

    $table: null,
    $tbody: null,
    $addRowBtn: null,

    init: function(id, blockType, inputNamePrefix, settings) {
        blockType = blockType[0]; 

        if (settings.fieldLayout == 'table') {
            new Craft.SuperTable.InputTable(id, blockType, inputNamePrefix, settings);
        } else {
            new Craft.SuperTable.InputRow(id, blockType, inputNamePrefix, settings);
        }
    }
});

Craft.SuperTable.InputTable = Garnish.Base.extend({
    id: null,
    blockType: null,
    inputNamePrefix: null,

    totalNewBlocks: 0,

    sorter: null,

    $div: null,
    $divInner: null,

    $table: null,
    $tbody: null,
    $addRowBtn: null,

    init: function(id, blockType, inputNamePrefix, settings) {
        this.id = id
        this.blockType = blockType;
        this.inputNamePrefix = inputNamePrefix;
        this.setSettings(settings, {
            rowIdPrefix: '',
            onAddRow: $.noop,
            onDeleteRow: $.proxy(this, 'deleteRow')
        });

        this.$table = $('table#' + id);
        this.$tbody = this.$table.children('tbody');

        this.sorter = new Craft.DataTableSorter(this.$table, {
            handle: 'td.super-table-action .move',
            helperClass: 'editablesupertablesorthelper',
            copyDraggeeInputValuesToHelper: true
        });

        this.$addRowBtn = this.$table.next('.add');
        this.addListener(this.$addRowBtn, 'activate', 'addRow');

        var $rows = this.$tbody.children();

        for (var i = 0; i < $rows.length; i++) {
            new Craft.EditableTable.Row(this, $rows[i]);

            var $block = $($rows[i]),
                id = $block.data('id');
                
            // Is this a new block?
            var newMatch = (typeof id == 'string' && id.match(/new(\d+)/));

            if (newMatch && newMatch[1] > this.totalNewBlocks) {
                this.totalNewBlocks = parseInt(newMatch[1]);
            }
        }

        this.updateAddBlockBtn();
    },

    addRow: function() {
        var type = this.blockType.type;

        this.totalNewBlocks++;

        var id = 'new'+this.totalNewBlocks;

        var bodyHtml = this.getParsedBlockHtml(this.blockType.bodyHtml, id),
            footHtml = this.getParsedBlockHtml(this.blockType.footHtml, id);

        var html = '<tr data-id="' + id + '">' +
            '<input type="hidden" name="' + this.inputNamePrefix + '[' + id + '][type]" value="' + type + '" />' +
            '' + bodyHtml + '' +
            '<td class="thin action super-table-action"><a class="move icon" title="' + Craft.t('super-table', 'Reorder') + '"></a></td>' +
            '<td class="thin action super-table-action"><a class="delete icon" title="' + Craft.t('super-table', 'Delete') + '"></a></td>' +
        '</tr>';

        var $tr = $(html).appendTo(this.$tbody);

        Garnish.$bod.append(footHtml);
        
        Craft.initUiElements($tr);

        new Craft.EditableTable.Row(this, $tr);
        this.sorter.addItems($tr);

        this.updateAddBlockBtn();
    },

    getParsedBlockHtml: function(html, id) {
        if (typeof html == 'string') {
            return html.replace(/__BLOCK_ST__/g, id);
        } else {
            return '';
        }
    },

    canAddMoreRows: function() {
        return (!this.settings.maxRows || this.$tbody.children().length < this.settings.maxRows);
    },

    updateAddBlockBtn: function() {
        if (this.canAddMoreRows()) {
            this.$addRowBtn.removeClass('disabled');
        } else {
            this.$addRowBtn.addClass('disabled');
        }
    },

    canDeleteRows: function() {
        return (!this.settings.minRows || this.$tbody.children().length > this.settings.minRows);
    },

    deleteRow: function(row) {
        if (!this.canDeleteRows()) {
            return;
        }

        this.sorter.removeItems(row.$tr);
        row.$tr.remove();

        this.updateAddBlockBtn();
    },

});






Craft.SuperTable.InputRow = Garnish.Base.extend({
    id: null,
    blockType: null,
    inputNamePrefix: null,
    settings: null,

    totalNewBlocks: 0,

    sorter: null,

    $div: null,
    $divInner: null,
    $rows: null,

    $table: null,
    $tbody: null,
    $addRowBtn: null,

    init: function(id, blockType, inputNamePrefix, settings) {
        this.id = id
        this.blockType = blockType;
        this.inputNamePrefix = inputNamePrefix;
        this.settings = settings;

        this.$div = $('div#'+id);
        this.$divInner = this.$div.children('.rowLayoutContainer');

        this.$rows = this.$divInner.children('.superTableRow');

        this.sorter = new Garnish.DragSort(this.$rows, {
            handle: 'tfoot .reorder .move',
            axis: 'y',
            collapseDraggees: true,
            magnetStrength: 4,
            helperLagBase: 1.5,
            helperOpacity: 0.9,
        });

        for (var i = 0; i < this.$rows.length; i++) {
            new Craft.SuperTable.InputRow.Row(this, this.$rows[i]);

            var $block = $(this.$rows[i]),
                id = $block.data('id');

            // Is this a new block?
            var newMatch = (typeof id == 'string' && id.match(/new(\d+)/));

            if (newMatch && newMatch[1] > this.totalNewBlocks) {
                this.totalNewBlocks = parseInt(newMatch[1]);
            }
        }

        this.$addRowBtn = this.$divInner.next('.add');
        this.addListener(this.$addRowBtn, 'activate', 'addRow');

        this.updateAddBlockBtn();

        this.addListener(this.$div, 'resize', 'onResize');
        Garnish.$doc.ready($.proxy(this, 'onResize'));
    },

    addRow: function() {
        var type = this.blockType.type;

        this.totalNewBlocks++;

        var id = 'new'+this.totalNewBlocks;

        var bodyHtml = this.getParsedBlockHtml(this.blockType.bodyHtml, id),
            footHtml = this.getParsedBlockHtml(this.blockType.footHtml, id);

        var html = '<div class="superTableRow" data-id="'+id+'">' +
            '<input type="hidden" name="'+this.inputNamePrefix+'['+id+'][type]" value="'+type+'">' +
            '<table id="'+id+'" class="superTable-table superTable-layout-row">' +
                '<tbody>' +
                    '' + bodyHtml + '' +
                '</tbody>' +
                '<tfoot>' +
                    '<tr>' +
                        '<td class="floating reorder"><a class="move icon" title="'+Craft.t('super-table', 'Reorder')+'"></a></td>' +
                        '<td class="floating delete"><a class="delete icon" title="'+Craft.t('super-table', 'Delete')+'"></a></td>' +
                    '</tr>' +
                '</tfoot>' +
            '</table>' +
        '</div>';

        var $tr = $(html).appendTo(this.$divInner);

        Garnish.$bod.append(footHtml);
        
        Craft.initUiElements($tr);

        var row = new Craft.SuperTable.InputRow.Row(this, $tr);
        this.sorter.addItems($tr);

        row.expand();

        this.updateAddBlockBtn();
    },

    getParsedBlockHtml: function(html, id) {
        if (typeof html == 'string') {
            return html.replace(/__BLOCK_ST__/g, id);
        } else {
            return '';
        }
    },

    canAddMoreRows: function() {
        return (!this.settings.maxRows || this.$divInner.children('.superTableRow').length < this.settings.maxRows);
    },

    onResize: function() {
        // A minor fix if this row contains a Matrix field. For Matrix fields with lots of blocks,
        // we need to make sure we trigger the resize-handling, which turns the Add Block buttons into a dropdown
        // otherwise, we get a nasty overflow of buttons.

        // Get the Super Table overall width, with some padding
        var actionBtnWidth = this.$divInner.find('tfoot tr').width();
        var rowHeaderWidth = this.$divInner.find('td.rowHeader').width();
        var rowWidth = this.$divInner.width() - actionBtnWidth - rowHeaderWidth - 20;
        var $matrixFields = this.$divInner.find('.matrix.matrix-field');

        if ($matrixFields.length) {
            $.each($matrixFields, function(i, element) {
                var $matrixField = $(element);
                var matrixButtonWidth = $matrixField.find('.buttons').outerWidth(true);

                if (matrixButtonWidth > rowWidth) {
                    // showNewBlockBtn is a custom function in MatrixInputAlt.js for minor impact
                    $matrixField.trigger('showNewBlockBtn');
                }
            });
        }
    },

    updateAddBlockBtn: function() {
        if (this.canAddMoreRows()) {
            this.$addRowBtn.removeClass('disabled');
        } else {
            this.$addRowBtn.addClass('disabled');
        }
    },
});

Craft.SuperTable.InputRow.Row = Garnish.Base.extend({
    table: null,

    $tr: null,
    $deleteBtn: null,

    init: function(table, tr) {
        this.table = table;
        this.$tr = $(tr);

        var $deleteBtn = this.$tr.children().last().find('tfoot .delete');
        this.addListener($deleteBtn, 'click', 'deleteRow');
    },

    canDeleteRows: function() {
        return (!this.table.settings.minRows || this.table.$divInner.children('.superTableRow').length > this.table.settings.minRows);
    },

    deleteRow: function() {
        if (!this.canDeleteRows()) {
            return;
        }

        this.table.sorter.removeItems(this.$tr);

        this.contract(function() {
            this.$tr.remove();

            this.table.updateAddBlockBtn();
        });
    },

    expand: function(callback) {
        this.$tr
            .css(this._getContractedStyles())
            .velocity(this._getExpandedStyles(), 'fast', callback ? $.proxy(callback, this) : null);
    },

    contract: function(callback) {
        this.$tr
            .css(this._getExpandedStyles())
            .velocity(this._getContractedStyles(), 'fast', callback ? $.proxy(callback, this) : null);
    },

    _getExpandedStyles: function() {
        return {
            opacity: 1,
            marginBottom: 10
        };
    },

    _getContractedStyles: function() {
        return {
            opacity: 0,
            marginBottom: -(this.$tr.outerHeight())
        };
    },
    
});



})(jQuery);
