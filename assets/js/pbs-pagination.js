(function () {
  'use strict';
  window.pbsPagination = function (host, onChange, countId) {
    var page = 1, size = 20, total = 0;
    host.className = 'pbs-pagination';
    host.innerHTML = '<div class="pbs-pagination-total">共 <span' + (countId ? ' id="' + countId + '"' : '') + ' data-count>0</span> 条记录，每页 <select aria-label="每页条数"><option>10</option><option selected>20</option><option>50</option></select> 条</div><nav aria-label="列表分页"></nav>';
    host.querySelector('select').onchange = function () { size = Number(this.value); page = 1; onChange(); };
    host.querySelector('nav').onclick = function (event) {
      var button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      page = Number(button.dataset.page); onChange();
    };
    return {
      range: function (count, reset) {
        total = count;
        var pages = Math.max(1, Math.ceil(total / size));
        page = reset ? 1 : Math.min(page, pages);
        host.querySelector('[data-count]').textContent = total;
        var html = '<button data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + '>上一页</button>';
        var first = Math.max(1, Math.min(page - 2, pages - 4));
        for (var number = first; number <= Math.min(pages, first + 4); number++) html += '<button data-page="' + number + '"' + (number === page ? ' class="is-current" aria-current="page"' : '') + '>' + number + '</button>';
        html += '<button data-page="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + '>下一页</button>';
        host.querySelector('nav').innerHTML = html;
        return { start: (page - 1) * size, end: page * size };
      }
    };
  };
})();
