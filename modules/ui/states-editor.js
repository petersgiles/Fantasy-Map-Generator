"use strict";
function editStates() {
  if (customization) return;
  closeDialogs("#statesEditor, .stable");
  if (!layerIsOn("toggleStates")) toggleStates();
  if (!layerIsOn("toggleBorders")) toggleBorders();
  if (layerIsOn("toggleCultures")) toggleCultures();
  if (layerIsOn("toggleBiomes")) toggleBiomes();
  if (layerIsOn("toggleReligions")) toggleReligions();

  const body = document.getElementById("statesBodySection");
  refreshStatesEditor();

  if (modules.editStates) return;
  modules.editStates = true;

  $("#statesEditor").dialog({
    title: "States Editor",
    resizable: false,
    width: fitContent(),
    close: closeStatesEditor,
    position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"}
  });

  // add listeners
  document.getElementById("statesEditorRefresh").addEventListener("click", refreshStatesEditor);
  document.getElementById("statesEditStyle").addEventListener("click", () => editStyle("regions"));
  document.getElementById("statesLegend").addEventListener("click", toggleLegend);
  document.getElementById("statesPercentage").addEventListener("click", togglePercentageMode);
  document.getElementById("statesChart").addEventListener("click", showStatesChart);
  document.getElementById("statesRegenerate").addEventListener("click", openRegenerationMenu);
  document.getElementById("statesRegenerateBack").addEventListener("click", exitRegenerationMenu);
  document.getElementById("statesRecalculate").addEventListener("click", () => recalculateStates(true));
  document.getElementById("statesRandomize").addEventListener("click", randomizeStatesExpansion);
  document.getElementById("statesNeutral").addEventListener("input", () => recalculateStates(false));
  document.getElementById("statesNeutralNumber").addEventListener("change", () => recalculateStates(false));
  document.getElementById("statesManually").addEventListener("click", enterStatesManualAssignent);
  document.getElementById("statesManuallyApply").addEventListener("click", applyStatesManualAssignent);
  document.getElementById("statesManuallyCancel").addEventListener("click", () => exitStatesManualAssignment());
  document.getElementById("statesAdd").addEventListener("click", enterAddStateMode);
  document.getElementById("statesExport").addEventListener("click", downloadStatesData);

  body.addEventListener("click", function (ev) {
    const el = ev.target,
      cl = el.classList,
      line = el.parentNode,
      state = +line.dataset.id;
    if (cl.contains("fillRect")) stateChangeFill(el);
    else if (cl.contains("name")) editStateName(state);
    else if (cl.contains("coaIcon")) editEmblem("state", "stateCOA" + state, pack.states[state]);
    else if (cl.contains("icon-star-empty")) stateCapitalZoomIn(state);
    else if (cl.contains("culturePopulation")) changePopulation(state);
    else if (cl.contains("icon-pin")) toggleFog(state, cl);
    else if (cl.contains("icon-trash-empty")) stateRemovePrompt(state);
  });

  body.addEventListener("input", function (ev) {
    const el = ev.target,
      cl = el.classList,
      line = el.parentNode,
      state = +line.dataset.id;
    if (cl.contains("stateCapital")) stateChangeCapitalName(state, line, el.value);
    else if (cl.contains("cultureType")) stateChangeType(state, line, el.value);
    else if (cl.contains("statePower")) stateChangeExpansionism(state, line, el.value);
  });

  body.addEventListener("change", function (ev) {
    const el = ev.target,
      cl = el.classList,
      line = el.parentNode,
      state = +line.dataset.id;
    if (cl.contains("stateCulture")) stateChangeCulture(state, line, el.value);
  });

  function refreshStatesEditor() {
    BurgsAndStates.collectStatistics();
    statesEditorAddLines();
  }

  // add line for each state
  function statesEditorAddLines() {
    const unit = areaUnit.value === "square" ? " " + distanceUnitInput.value + "²" : " " + areaUnit.value;
    const hidden = statesRegenerateButtons.style.display === "block" ? "" : "hidden"; // show/hide regenerate columns
    let lines = "",
      totalArea = 0,
      totalPopulation = 0,
      totalBurgs = 0;

    for (const s of pack.states) {
      if (s.removed) continue;
      const area = s.area * distanceScaleInput.value ** 2;
      const rural = s.rural * populationRate;
      const urban = s.urban * populationRate * urbanization;
      const population = rn(rural + urban);
      const populationTip = `Total population: ${si(population)}; Rural population: ${si(rural)}; Urban population: ${si(urban)}. Click to change`;
      totalArea += area;
      totalPopulation += population;
      totalBurgs += s.burgs;
      const focused = defs.select("#fog #focusState" + s.i).size();

      if (!s.i) {
        // Neutral line
        lines += `<div class="states" data-id=${s.i} data-name="${s.name}" data-cells=${s.cells} data-area=${area} 
        data-population=${population} data-burgs=${s.burgs} data-color="" data-form="" data-capital="" data-culture="" data-type="" data-expansionism="">
          <svg width="9" height="9" class="placeholder"></svg>
          <input data-tip="Neutral lands name. Click to change" class="stateName name pointer italic" value="${s.name}" readonly>
          <svg class="coaIcon placeholder hide"></svg>
          <input class="stateForm placeholder" value="none">
          <span class="icon-star-empty placeholder hide"></span>
          <input class="stateCapital placeholder hide">
          <select class="stateCulture placeholder hide">${getCultureOptions(0)}</select>
          <span data-tip="Burgs count" style="padding-right: 1px" class="icon-dot-circled hide"></span>
          <div data-tip="Burgs count" class="stateBurgs hide">${s.burgs}</div>
          <span data-tip="Neutral lands area" style="padding-right: 4px" class="icon-map-o hide"></span>
          <div data-tip="Neutral lands area" class="biomeArea hide">${si(area) + unit}</div>
          <span data-tip="${populationTip}" class="icon-male hide"></span>
          <div data-tip="${populationTip}" class="culturePopulation hide">${si(population)}</div>
          <select class="cultureType ${hidden} placeholder show hide">${getTypeOptions(0)}</select>
          <span class="icon-resize-full ${hidden} placeholder show hide"></span>
          <input class="statePower ${hidden} placeholder show hide" type="number" value=0>
          <span data-tip="Cells count" class="icon-check-empty ${hidden} show hide"></span>
          <div data-tip="Cells count" class="stateCells ${hidden} show hide">${s.cells}</div>
        </div>`;
        continue;
      }

      const capital = pack.burgs[s.capital].name;
      COArenderer.trigger("stateCOA" + s.i, s.coa);
      lines += `<div class="states" data-id=${s.i} data-name="${s.name}" data-form="${s.formName}" data-capital="${capital}" data-color="${
        s.color
      }" data-cells=${s.cells}
        data-area=${area} data-population=${population} data-burgs=${s.burgs} data-culture=${pack.cultures[s.culture].name} data-type=${
        s.type
      } data-expansionism=${s.expansionism}>
        <svg data-tip="State fill style. Click to change" width=".9em" height=".9em" style="margin-bottom:-1px"><rect x="0" y="0" width="100%" height="100%" fill="${
          s.color
        }" class="fillRect pointer"></svg>
        <input data-tip="State name. Click to change" class="stateName name pointer" value="${s.name}" readonly>
        <svg data-tip="Click to show and edit state emblem" class="coaIcon pointer hide" viewBox="0 0 200 200"><use href="#stateCOA${s.i}"></use></svg>
        <input data-tip="State form name. Click to change" class="stateForm name pointer" value="${s.formName}" readonly>
        <span data-tip="State capital. Click to zoom into view" class="icon-star-empty pointer hide"></span>
        <input data-tip="Capital name. Click and type to rename" class="stateCapital hide" value="${capital}" autocorrect="off" spellcheck="false"/>
        <select data-tip="Dominant culture. Click to change" class="stateCulture hide">${getCultureOptions(s.culture)}</select>
        <span data-tip="Burgs count" style="padding-right: 1px" class="icon-dot-circled hide"></span>
        <div data-tip="Burgs count" class="stateBurgs hide">${s.burgs}</div>
        <span data-tip="State area" style="padding-right: 4px" class="icon-map-o hide"></span>
        <div data-tip="State area" class="biomeArea hide">${si(area) + unit}</div>
        <span data-tip="${populationTip}" class="icon-male hide"></span>
        <div data-tip="${populationTip}" class="culturePopulation hide">${si(population)}</div>
        <select data-tip="State type. Defines growth model. Click to change" class="cultureType ${hidden} show hide">${getTypeOptions(s.type)}</select>
        <span data-tip="State expansionism" class="icon-resize-full ${hidden} show hide"></span>
        <input data-tip="Expansionism (defines competitive size). Change to re-calculate states based on new value" class="statePower ${hidden} show hide" type="number" min=0 max=99 step=.1 value=${
        s.expansionism
      }>
        <span data-tip="Cells count" class="icon-check-empty ${hidden} show hide"></span>
        <div data-tip="Cells count" class="stateCells ${hidden} show hide">${s.cells}</div>
        <span data-tip="Toggle state focus" class="icon-pin ${focused ? "" : " inactive"} hide"></span>
        <span data-tip="Remove the state" class="icon-trash-empty hide"></span>
      </div>`;
    }
    body.innerHTML = lines;

    // update footer
    statesFooterStates.innerHTML = pack.states.filter(s => s.i && !s.removed).length;
    statesFooterCells.innerHTML = pack.cells.h.filter(h => h >= 20).length;
    statesFooterBurgs.innerHTML = totalBurgs;
    statesFooterArea.innerHTML = si(totalArea) + unit;
    statesFooterPopulation.innerHTML = si(totalPopulation);
    statesFooterArea.dataset.area = totalArea;
    statesFooterPopulation.dataset.population = totalPopulation;

    body.querySelectorAll("div.states").forEach(el => {
      el.addEventListener("click", selectStateOnLineClick);
      el.addEventListener("mouseenter", ev => stateHighlightOn(ev));
      el.addEventListener("mouseleave", ev => stateHighlightOff(ev));
    });

    if (body.dataset.type === "percentage") {
      body.dataset.type = "absolute";
      togglePercentageMode();
    }
    applySorting(statesHeader);
    $("#statesEditor").dialog({width: fitContent()});
  }

  function getCultureOptions(culture) {
    let options = "";
    pack.cultures.forEach(c => {
      if (!c.removed) {
        options += `<option ${c.i === culture ? "selected" : ""} value="${c.i}">${c.name}</option>`;
      }
    });
    return options;
  }

  function getTypeOptions(type) {
    let options = "";
    const types = ["Generic", "River", "Lake", "Naval", "Nomadic", "Hunting", "Highland"];
    types.forEach(t => (options += `<option ${type === t ? "selected" : ""} value="${t}">${t}</option>`));
    return options;
  }

  function stateHighlightOn(event) {
    if (!layerIsOn("toggleStates")) return;
    if (defs.select("#fog path").size()) return;

    const state = +event.target.dataset.id;
    if (customization || !state) return;
    const d = regions.select("#state" + state).attr("d");

    const path = debug
      .append("path")
      .attr("class", "highlight")
      .attr("d", d)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("opacity", 1)
      .attr("filter", "url(#blur1)");

    const l = path.node().getTotalLength(),
      dur = (l + 5000) / 2;
    const i = d3.interpolateString("0," + l, l + "," + l);
    path
      .transition()
      .duration(dur)
      .attrTween("stroke-dasharray", function () {
        return t => i(t);
      });
  }

  function stateHighlightOff() {
    debug.selectAll(".highlight").each(function () {
      d3.select(this).transition().duration(1000).attr("opacity", 0).remove();
    });
  }

  function stateChangeFill(el) {
    const currentFill = el.getAttribute("fill");
    const state = +el.parentNode.parentNode.dataset.id;

    const callback = function (fill) {
      el.setAttribute("fill", fill);
      pack.states[state].color = fill;
      statesBody.select("#state" + state).attr("fill", fill);
      statesBody.select("#state-gap" + state).attr("stroke", fill);
      const halo = d3.color(fill) ? d3.color(fill).darker().hex() : "#666666";
      statesHalo.select("#state-border" + state).attr("stroke", halo);

      // recolor regiments
      const solidColor = fill[0] === "#" ? fill : "#999";
      const darkerColor = d3.color(solidColor).darker().hex();
      armies.select("#army" + state).attr("fill", solidColor);
      armies
        .select("#army" + state)
        .selectAll("g > rect:nth-of-type(2)")
        .attr("fill", darkerColor);
    };

    openPicker(currentFill, callback);
  }

  function editStateName(state) {
    // reset input value and close add mode
    stateNameEditorCustomForm.value = "";
    const addModeActive = stateNameEditorCustomForm.style.display === "inline-block";
    if (addModeActive) {
      stateNameEditorCustomForm.style.display = "none";
      stateNameEditorSelectForm.style.display = "inline-block";
    }

    const s = pack.states[state];
    document.getElementById("stateNameEditor").dataset.state = state;
    document.getElementById("stateNameEditorShort").value = s.name || "";
    applyOption(stateNameEditorSelectForm, s.formName);
    document.getElementById("stateNameEditorFull").value = s.fullName || "";

    $("#stateNameEditor").dialog({
      resizable: false,
      title: "Change state name",
      buttons: {
        Apply: function () {
          applyNameChange(s);
          $(this).dialog("close");
        },
        Cancel: function () {
          $(this).dialog("close");
        }
      },
      position: {my: "center", at: "center", of: "svg"}
    });

    if (modules.editStateName) return;
    modules.editStateName = true;

    // add listeners
    document.getElementById("stateNameEditorShortCulture").addEventListener("click", regenerateShortNameCuture);
    document.getElementById("stateNameEditorShortRandom").addEventListener("click", regenerateShortNameRandom);
    document.getElementById("stateNameEditorAddForm").addEventListener("click", addCustomForm);
    document.getElementById("stateNameEditorCustomForm").addEventListener("change", addCustomForm);
    document.getElementById("stateNameEditorFullRegenerate").addEventListener("click", regenerateFullName);

    function regenerateShortNameCuture() {
      const state = +stateNameEditor.dataset.state;
      const culture = pack.states[state].culture;
      const name = Names.getState(Names.getCultureShort(culture), culture);
      document.getElementById("stateNameEditorShort").value = name;
    }

    function regenerateShortNameRandom() {
      const base = rand(nameBases.length - 1);
      const name = Names.getState(Names.getBase(base), undefined, base);
      document.getElementById("stateNameEditorShort").value = name;
    }

    function addCustomForm() {
      const value = stateNameEditorCustomForm.value;
      const addModeActive = stateNameEditorCustomForm.style.display === "inline-block";
      stateNameEditorCustomForm.style.display = addModeActive ? "none" : "inline-block";
      stateNameEditorSelectForm.style.display = addModeActive ? "inline-block" : "none";
      if (value && addModeActive) applyOption(stateNameEditorSelectForm, value);
      stateNameEditorCustomForm.value = "";
    }

    function regenerateFullName() {
      const short = document.getElementById("stateNameEditorShort").value;
      const form = document.getElementById("stateNameEditorSelectForm").value;
      document.getElementById("stateNameEditorFull").value = getFullName();

      function getFullName() {
        if (!form) return short;
        if (!short && form) return "The " + form;
        const tick = +stateNameEditorFullRegenerate.dataset.tick;
        stateNameEditorFullRegenerate.dataset.tick = tick + 1;
        return tick % 2 ? getAdjective(short) + " " + form : form + " of " + short;
      }
    }

    function applyNameChange(s) {
      const nameInput = document.getElementById("stateNameEditorShort");
      const formSelect = document.getElementById("stateNameEditorSelectForm");
      const fullNameInput = document.getElementById("stateNameEditorFull");

      const nameChanged = nameInput.value !== s.name;
      const formChanged = formSelect.value !== s.formName;
      const fullNameChanged = fullNameInput.value !== s.fullName;
      const changed = nameChanged || formChanged || fullNameChanged;

      if (formChanged) {
        const selected = formSelect.selectedOptions[0];
        const form = selected.parentElement.label || null;
        if (form) s.form = form;
      }

      s.name = nameInput.value;
      s.formName = formSelect.value;
      s.fullName = fullNameInput.value;
      if (changed && stateNameEditorUpdateLabel.checked) BurgsAndStates.drawStateLabels([s.i]);
      refreshStatesEditor();
    }
  }

  function stateChangeCapitalName(state, line, value) {
    line.dataset.capital = value;
    const capital = pack.states[state].capital;
    if (!capital) return;
    pack.burgs[capital].name = value;
    document.querySelector("#burgLabel" + capital).textContent = value;
  }

  function changePopulation(state) {
    const s = pack.states[state];
    if (!s.cells) {
      tip("State does not have any cells, cannot change population", false, "error");
      return;
    }
    const rural = rn(s.rural * populationRate);
    const urban = rn(s.urban * populationRate * urbanization);
    const total = rural + urban;
    const l = n => Number(n).toLocaleString();

    alertMessage.innerHTML = `
    Rural: <input type="number" min=0 step=1 id="ruralPop" value=${rural} style="width:6em">
    Urban: <input type="number" min=0 step=1 id="urbanPop" value=${urban} style="width:6em" ${s.burgs ? "" : "disabled"}>
    <p>Total population: ${l(total)} ⇒ <span id="totalPop">${l(total)}</span> (<span id="totalPopPerc">100</span>%)</p>`;

    const update = function () {
      const totalNew = ruralPop.valueAsNumber + urbanPop.valueAsNumber;
      if (isNaN(totalNew)) return;
      totalPop.innerHTML = l(totalNew);
      totalPopPerc.innerHTML = rn((totalNew / total) * 100);
    };

    ruralPop.oninput = () => update();
    urbanPop.oninput = () => update();

    $("#alert").dialog({
      resizable: false,
      title: "Change state population",
      width: "24em",
      buttons: {
        Apply: function () {
          applyPopulationChange();
          $(this).dialog("close");
        },
        Cancel: function () {
          $(this).dialog("close");
        }
      },
      position: {my: "center", at: "center", of: "svg"}
    });

    function applyPopulationChange() {
      const ruralChange = ruralPop.value / rural;
      if (isFinite(ruralChange) && ruralChange !== 1) {
        const cells = pack.cells.i.filter(i => pack.cells.state[i] === state);
        cells.forEach(i => (pack.cells.pop[i] *= ruralChange));
      }
      if (!isFinite(ruralChange) && +ruralPop.value > 0) {
        const points = ruralPop.value / populationRate;
        const cells = pack.cells.i.filter(i => pack.cells.state[i] === state);
        const pop = points / cells.length;
        cells.forEach(i => (pack.cells.pop[i] = pop));
      }

      const urbanChange = urbanPop.value / urban;
      if (isFinite(urbanChange) && urbanChange !== 1) {
        const burgs = pack.burgs.filter(b => !b.removed && b.state === state);
        burgs.forEach(b => (b.population = rn(b.population * urbanChange, 4)));
      }
      if (!isFinite(urbanChange) && +urbanPop.value > 0) {
        const points = urbanPop.value / populationRate / urbanization;
        const burgs = pack.burgs.filter(b => !b.removed && b.state === state);
        const population = rn(points / burgs.length, 4);
        burgs.forEach(b => (b.population = population));
      }

      refreshStatesEditor();
    }
  }

  function stateCapitalZoomIn(state) {
    const capital = pack.states[state].capital;
    const l = burgLabels.select("[data-id='" + capital + "']");
    const x = +l.attr("x"),
      y = +l.attr("y");
    zoomTo(x, y, 8, 2000);
  }

  function stateChangeCulture(state, line, value) {
    line.dataset.base = pack.states[state].culture = +value;
  }

  function stateChangeType(state, line, value) {
    line.dataset.type = pack.states[state].type = value;
    recalculateStates();
  }

  function stateChangeExpansionism(state, line, value) {
    line.dataset.expansionism = pack.states[state].expansionism = value;
    recalculateStates();
  }

  function toggleFog(state, cl) {
    if (customization) return;
    const path = statesBody.select("#state" + state).attr("d"),
      id = "focusState" + state;
    cl.contains("inactive") ? fog(id, path) : unfog(id);
    cl.toggle("inactive");
  }

  function stateRemovePrompt(state) {
    if (customization) return;

    alertMessage.innerHTML = "Are you sure you want to remove the state? <br>This action cannot be reverted";
    $("#alert").dialog({
      resizable: false,
      title: "Remove state",
      buttons: {
        Remove: function () {
          $(this).dialog("close");
          stateRemove(state);
        },
        Cancel: function () {
          $(this).dialog("close");
        }
      }
    });
  }

  function stateRemove(state) {
    statesBody.select("#state" + state).remove();
    statesBody.select("#state-gap" + state).remove();
    statesHalo.select("#state-border" + state).remove();
    labels.select("#stateLabel" + state).remove();
    defs.select("#textPath_stateLabel" + state).remove();

    unfog("focusState" + state);
    pack.burgs.forEach(b => {
      if (b.state === state) b.state = 0;
    });
    pack.cells.state.forEach((s, i) => {
      if (s === state) pack.cells.state[i] = 0;
    });

    // remove emblem
    const coaId = "stateCOA" + state;
    document.getElementById(coaId).remove();
    emblems.select(`#stateEmblems > use[data-i='${state}']`).remove();

    // remove provinces
    pack.states[state].provinces.forEach(p => {
      pack.provinces[p] = {i: p, removed: true};
      pack.cells.province.forEach((pr, i) => {
        if (pr === p) pack.cells.province[i] = 0;
      });

      const coaId = "provinceCOA" + p;
      if (document.getElementById(coaId)) document.getElementById(coaId).remove();
      emblems.select(`#provinceEmblems > use[data-i='${p}']`).remove();
      const g = provs.select("#provincesBody");
      g.select("#province" + p).remove();
      g.select("#province-gap" + p).remove();
    });

    // remove military
    pack.states[state].military.forEach(m => {
      const id = `regiment${state}-${m.i}`;
      const index = notes.findIndex(n => n.id === id);
      if (index != -1) notes.splice(index, 1);
    });
    armies.select("g#army" + state).remove();

    const capital = pack.states[state].capital;
    pack.burgs[capital].capital = 0;
    pack.burgs[capital].state = 0;
    moveBurgToGroup(capital, "towns");

    pack.states[state] = {i: state, removed: true};

    debug.selectAll(".highlight").remove();
    if (!layerIsOn("toggleStates")) toggleStates();
    else drawStates();
    if (!layerIsOn("toggleBorders")) toggleBorders();
    else drawBorders();
    if (layerIsOn("toggleProvinces")) drawProvinces();
    refreshStatesEditor();
  }

  function toggleLegend() {
    if (legend.selectAll("*").size()) {
      clearLegend();
      return;
    } // hide legend
    const data = pack.states
      .filter(s => s.i && !s.removed && s.cells)
      .sort((a, b) => b.area - a.area)
      .map(s => [s.i, s.color, s.name]);
    drawLegend("States", data);
  }

  function togglePercentageMode() {
    if (body.dataset.type === "absolute") {
      body.dataset.type = "percentage";
      const totalCells = +statesFooterCells.innerHTML;
      const totalBurgs = +statesFooterBurgs.innerHTML;
      const totalArea = +statesFooterArea.dataset.area;
      const totalPopulation = +statesFooterPopulation.dataset.population;

      body.querySelectorAll(":scope > div").forEach(function (el) {
        el.querySelector(".stateCells").innerHTML = rn((+el.dataset.cells / totalCells) * 100) + "%";
        el.querySelector(".stateBurgs").innerHTML = rn((+el.dataset.burgs / totalBurgs) * 100) + "%";
        el.querySelector(".biomeArea").innerHTML = rn((+el.dataset.area / totalArea) * 100) + "%";
        el.querySelector(".culturePopulation").innerHTML = rn((+el.dataset.population / totalPopulation) * 100) + "%";
      });
    } else {
      body.dataset.type = "absolute";
      statesEditorAddLines();
    }
  }

  function showStatesChart() {
    // build hierarchy tree
    const statesData = pack.states.filter(s => !s.removed);
    if (statesData.length < 2) return tip("There are no states to show", false, "error");

    const root = d3
      .stratify()
      .id(d => d.i)
      .parentId(d => (d.i ? 0 : null))(statesData)
      .sum(d => d.area)
      .sort((a, b) => b.value - a.value);

    const size = 150 + 200 * uiSizeOutput.value;
    const margin = {top: 0, right: -50, bottom: 0, left: -50};
    const w = size - margin.left - margin.right;
    const h = size - margin.top - margin.bottom;
    const treeLayout = d3.pack().size([w, h]).padding(3);

    // prepare svg
    alertMessage.innerHTML = `<select id="statesTreeType" style="display:block; margin-left:13px; font-size:11px">
      <option value="area" selected>Area</option>
      <option value="population">Total population</option>
      <option value="rural">Rural population</option>
      <option value="urban">Urban population</option>
      <option value="burgs">Burgs number</option>
    </select>`;
    alertMessage.innerHTML += `<div id='statesInfo' class='chartInfo'>&#8205;</div>`;

    const svg = d3
      .select("#alertMessage")
      .insert("svg", "#statesInfo")
      .attr("id", "statesTree")
      .attr("width", size)
      .attr("height", size)
      .style("font-family", "Almendra SC")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central");
    const graph = svg.append("g").attr("transform", `translate(-50, 0)`);
    document.getElementById("statesTreeType").addEventListener("change", updateChart);

    treeLayout(root);

    const node = graph
      .selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("data-id", d => d.data.i)
      .on("mouseenter", d => showInfo(event, d))
      .on("mouseleave", d => hideInfo(event, d));

    node
      .append("circle")
      .attr("fill", d => d.data.color)
      .attr("r", d => d.r);

    const exp = /(?=[A-Z][^A-Z])/g;
    const lp = n => d3.max(n.split(exp).map(p => p.length)) + 1; // longest name part + 1

    node
      .append("text")
      .style("font-size", d => rn((d.r ** 0.97 * 4) / lp(d.data.name), 2) + "px")
      .selectAll("tspan")
      .data(d => d.data.name.split(exp))
      .join("tspan")
      .attr("x", 0)
      .text(d => d)
      .attr("dy", (d, i, n) => `${i ? 1 : (n.length - 1) / -2}em`);

    function showInfo(ev, d) {
      d3.select(ev.target).select("circle").classed("selected", 1);
      const state = d.data.fullName;

      const unit = areaUnit.value === "square" ? " " + distanceUnitInput.value + "²" : " " + areaUnit.value;
      const area = d.data.area * distanceScaleInput.value ** 2 + unit;
      const rural = rn(d.data.rural * populationRate);
      const urban = rn(d.data.urban * populationRate * urbanization);

      const option = statesTreeType.value;
      const value =
        option === "area"
          ? "Area: " + area
          : option === "rural"
          ? "Rural population: " + si(rural)
          : option === "urban"
          ? "Urban population: " + si(urban)
          : option === "burgs"
          ? "Burgs number: " + d.data.burgs
          : "Population: " + si(rural + urban);

      statesInfo.innerHTML = `${state}. ${value}`;
      stateHighlightOn(ev);
    }

    function hideInfo(ev) {
      stateHighlightOff(ev);
      if (!document.getElementById("statesInfo")) return;
      statesInfo.innerHTML = "&#8205;";
      d3.select(ev.target).select("circle").classed("selected", 0);
    }

    function updateChart() {
      const value =
        this.value === "area"
          ? d => d.area
          : this.value === "rural"
          ? d => d.rural
          : this.value === "urban"
          ? d => d.urban
          : this.value === "burgs"
          ? d => d.burgs
          : d => d.rural + d.urban;

      root.sum(value);
      node.data(treeLayout(root).leaves());

      node
        .transition()
        .duration(1500)
        .attr("transform", d => `translate(${d.x},${d.y})`);
      node
        .select("circle")
        .transition()
        .duration(1500)
        .attr("r", d => d.r);
      node
        .select("text")
        .transition()
        .duration(1500)
        .style("font-size", d => rn((d.r ** 0.97 * 4) / lp(d.data.name), 2) + "px");
    }

    $("#alert").dialog({
      title: "States bubble chart",
      width: fitContent(),
      position: {my: "left bottom", at: "left+10 bottom-10", of: "svg"},
      buttons: {},
      close: () => {
        alertMessage.innerHTML = "";
      }
    });
  }

  function openRegenerationMenu() {
    statesBottom.querySelectorAll(":scope > button").forEach(el => (el.style.display = "none"));
    statesRegenerateButtons.style.display = "block";

    statesEditor.querySelectorAll(".show").forEach(el => el.classList.remove("hidden"));
    $("#statesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"}});
  }

  function recalculateStates(must) {
    if (!must && !statesAutoChange.checked) return;

    BurgsAndStates.expandStates();
    BurgsAndStates.generateProvinces();
    if (!layerIsOn("toggleStates")) toggleStates();
    else drawStates();
    if (!layerIsOn("toggleBorders")) toggleBorders();
    else drawBorders();
    if (layerIsOn("toggleProvinces")) drawProvinces();
    if (adjustLabels.checked) BurgsAndStates.drawStateLabels();
    refreshStatesEditor();
  }

  function randomizeStatesExpansion() {
    pack.states.forEach(s => {
      if (!s.i || s.removed) return;
      const expansionism = rn(Math.random() * 4 + 1, 1);
      s.expansionism = expansionism;
      body.querySelector("div.states[data-id='" + s.i + "'] > input.statePower").value = expansionism;
    });
    recalculateStates(true, true);
  }

  function exitRegenerationMenu() {
    statesBottom.querySelectorAll(":scope > button").forEach(el => (el.style.display = "inline-block"));
    statesRegenerateButtons.style.display = "none";
    statesEditor.querySelectorAll(".show").forEach(el => el.classList.add("hidden"));
    $("#statesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"}});
  }

  function enterStatesManualAssignent() {
    if (!layerIsOn("toggleStates")) toggleStates();
    customization = 2;
    statesBody.append("g").attr("id", "temp");
    document.querySelectorAll("#statesBottom > button").forEach(el => (el.style.display = "none"));
    document.getElementById("statesManuallyButtons").style.display = "inline-block";
    document.getElementById("statesHalo").style.display = "none";

    statesEditor.querySelectorAll(".hide").forEach(el => el.classList.add("hidden"));
    statesFooter.style.display = "none";
    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "none"));
    $("#statesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"}});

    tip("Click on state to select, drag the circle to change state", true);
    viewbox
      .style("cursor", "crosshair")
      .on("click", selectStateOnMapClick)
      .call(d3.drag().on("start", dragStateBrush))
      .on("touchmove mousemove", moveStateBrush);

    body.querySelector("div").classList.add("selected");
  }

  function selectStateOnLineClick() {
    if (customization !== 2) return;
    if (this.parentNode.id !== "statesBodySection") return;
    body.querySelector("div.selected").classList.remove("selected");
    this.classList.add("selected");
  }

  function selectStateOnMapClick() {
    const point = d3.mouse(this);
    const i = findCell(point[0], point[1]);
    if (pack.cells.h[i] < 20) return;

    const assigned = statesBody.select("#temp").select("polygon[data-cell='" + i + "']");
    const state = assigned.size() ? +assigned.attr("data-state") : pack.cells.state[i];

    body.querySelector("div.selected").classList.remove("selected");
    body.querySelector("div[data-id='" + state + "']").classList.add("selected");
  }

  function dragStateBrush() {
    const r = +statesManuallyBrush.value;

    d3.event.on("drag", () => {
      if (!d3.event.dx && !d3.event.dy) return;
      const p = d3.mouse(this);
      moveCircle(p[0], p[1], r);

      const found = r > 5 ? findAll(p[0], p[1], r) : [findCell(p[0], p[1], r)];
      const selection = found.filter(isLand);
      if (selection) changeStateForSelection(selection);
    });
  }

  // change state within selection
  function changeStateForSelection(selection) {
    const temp = statesBody.select("#temp");
    const selected = body.querySelector("div.selected");

    const stateNew = +selected.dataset.id;
    const color = pack.states[stateNew].color || "#ffffff";

    selection.forEach(function (i) {
      const exists = temp.select("polygon[data-cell='" + i + "']");
      const stateOld = exists.size() ? +exists.attr("data-state") : pack.cells.state[i];
      if (stateNew === stateOld) return;
      if (i === pack.states[stateOld].center) return;

      // change of append new element
      if (exists.size()) exists.attr("data-state", stateNew).attr("fill", color).attr("stroke", color);
      else temp.append("polygon").attr("data-cell", i).attr("data-state", stateNew).attr("points", getPackPolygon(i)).attr("fill", color).attr("stroke", color);
    });
  }

  function moveStateBrush() {
    showMainTip();
    const point = d3.mouse(this);
    const radius = +statesManuallyBrush.value;
    moveCircle(point[0], point[1], radius);
  }

  function applyStatesManualAssignent() {
    const {cells} = pack;
    const affectedStates = [];
    const affectedProvinces = [];

    statesBody
      .select("#temp")
      .selectAll("polygon")
      .each(function () {
        const i = +this.dataset.cell;
        const c = +this.dataset.state;
        affectedStates.push(cells.state[i], c);
        affectedProvinces.push(cells.province[i]);
        cells.state[i] = c;
        if (cells.burg[i]) pack.burgs[cells.burg[i]].state = c;
      });

    if (affectedStates.length) {
      refreshStatesEditor();
      layerIsOn("toggleStates") ? drawStates() : toggleStates();
      if (adjustLabels.checked) BurgsAndStates.drawStateLabels([...new Set(affectedStates)]);
      adjustProvinces([...new Set(affectedProvinces)]);
      layerIsOn("toggleBorders") ? drawBorders() : toggleBorders();
      if (layerIsOn("toggleProvinces")) drawProvinces();
    }

    exitStatesManualAssignment();
  }

  function adjustProvinces(affectedProvinces) {
    const {cells, provinces, states, burgs} = pack;

    affectedProvinces.forEach(provinceId => {
      if (!provinces[provinceId]) return; // lands without province captured => do nothing

      // find states owning at least 1 province cell
      const provCells = cells.i.filter(i => cells.province[i] === provinceId);
      const provStates = [...new Set(provCells.map(i => cells.state[i]))];

      // province is captured completely => change owner or remove
      if (provinceId && provStates.length === 1) return changeProvinceOwner(provinceId, provStates[0], provCells);

      // province is captured partially => split province
      splitProvince(provinceId, provStates, provCells);
    });

    function changeProvinceOwner(provinceId, newOwnerId, provinceCells) {
      const province = provinces[provinceId];
      const prevOwner = states[province.state];

      // remove province from old owner list
      prevOwner.provinces = prevOwner.provinces.filter(province => province !== provinceId);

      if (newOwnerId) {
        // new owner is a state => change owner
        province.state = newOwnerId;
        states[newOwnerId].provinces.push(provinceId);
      } else {
        // new owner is neutral => remove province
        provinces[provinceId] = {i: provinceId, removed: true};
        provinceCells.forEach(i => {
          cells.province[i] = 0;
        });
      }
    }

    function splitProvince(provinceId, provinceStates, provinceCells) {
      const province = provinces[provinceId];
      const prevOwner = states[province.state];
      const provinceCenterOwner = cells.state[province.center];

      provinceStates.forEach(stateId => {
        const stateProvinceCells = provinceCells.filter(i => cells.state[i] === stateId);

        if (stateId === provinceCenterOwner) {
          // province center is owned by the same state => do nothing for this state
          if (stateId === prevOwner.i) return;

          // province center is captured by neutrals => remove province
          if (!stateId) {
            provinces[provinceId] = {i: provinceId, removed: true};
            stateProvinceCells.forEach(i => {
              cells.province[i] = 0;
            });
            return;
          }

          // reassign province ownership to province center owner
          prevOwner.provinces = prevOwner.provinces.filter(province => province !== provinceId);
          province.state = stateId;
          province.color = getMixedColor(states[stateId].color);
          states[stateId].provinces.push(provinceId);
          return;
        }

        // province cells captured by neutrals => remove captured cells from province
        if (!stateId) {
          stateProvinceCells.forEach(i => {
            cells.province[i] = 0;
          });
          return;
        }

        // a few province cells owned by state => add to closes province
        if (stateProvinceCells.length < 20) {
          const closestProvince = findClosestProvince(provinceId, stateId, stateProvinceCells);
          if (closestProvince) {
            stateProvinceCells.forEach(i => {
              cells.province[i] = closestProvince;
            });
            return;
          }
        }

        // some province cells owned by state => create new province
        createProvince(province, stateId, stateProvinceCells);
      });
    }

    function createProvince(oldProvince, stateId, provinceCells) {
      const newProvinceId = provinces.length;
      const burgCell = provinceCells.find(i => cells.burg[i]);
      const center = burgCell ? burgCell : provinceCells[0];
      const burgId = burgCell ? cells.burg[burgCell] : 0;
      const burg = burgId ? burgs[burgId] : null;
      const culture = cells.culture[center];

      const nameByBurg = burgCell && P(0.5);
      const name = nameByBurg ? burg.name : oldProvince.name || Names.getState(Names.getCultureShort(culture), culture);

      const formOptions = ["Zone", "Area", "Territory", "Province"];
      const formName = burgCell && oldProvince.formName ? oldProvince.formName : ra(formOptions);

      const color = getMixedColor(states[stateId].color);

      const kinship = nameByBurg ? 0.8 : 0.4;
      const type = BurgsAndStates.getType(center, burg?.port);
      const coa = COA.generate(burg?.coa || states[stateId].coa, kinship, burg ? null : 0.9, type);
      coa.shield = COA.getShield(culture, stateId);

      provinces.push({i: newProvinceId, state: stateId, center, burg: burgId, name, formName, fullName: `${name} ${formName}`, color, coa});

      provinceCells.forEach(i => {
        cells.province[i] = newProvinceId;
      });

      states[stateId].provinces.push(newProvinceId);
    }

    function findClosestProvince(provinceId, stateId, sourceCells) {
      const borderCell = sourceCells.find(i =>
        cells.c[i].some(c => {
          return cells.state[c] === stateId && cells.province[c] && cells.province[c] !== provinceId;
        })
      );

      const closesProvince = borderCell && cells.c[borderCell].map(c => cells.province[c]).find(province => province && province !== provinceId);
      return closesProvince;
    }
  }

  function exitStatesManualAssignment(close) {
    customization = 0;
    statesBody.select("#temp").remove();
    removeCircle();
    document.querySelectorAll("#statesBottom > button").forEach(el => (el.style.display = "inline-block"));
    document.getElementById("statesManuallyButtons").style.display = "none";
    document.getElementById("statesHalo").style.display = "block";

    statesEditor.querySelectorAll(".hide:not(.show)").forEach(el => el.classList.remove("hidden"));
    statesFooter.style.display = "block";
    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "all"));
    if (!close) $("#statesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"}});

    restoreDefaultEvents();
    clearMainTip();
    const selected = body.querySelector("div.selected");
    if (selected) selected.classList.remove("selected");
  }

  function enterAddStateMode() {
    if (this.classList.contains("pressed")) {
      exitAddStateMode();
      return;
    }
    customization = 3;
    this.classList.add("pressed");
    tip("Click on the map to create a new capital or promote an existing burg", true);
    viewbox.style("cursor", "crosshair").on("click", addState);
    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "none"));
  }

  function addState() {
    const {cells, states, burgs} = pack;
    const point = d3.mouse(this);
    const center = findCell(point[0], point[1]);
    if (cells.h[center] < 20) return tip("You cannot place state into the water. Please click on a land cell", false, "error");

    let burg = cells.burg[center];
    if (burg && burgs[burg].capital) return tip("Existing capital cannot be selected as a new state capital! Select other cell", false, "error");

    if (!burg) burg = addBurg(point); // add new burg

    const oldState = cells.state[center];
    const newState = states.length;

    // turn burg into a capital
    burgs[burg].capital = 1;
    burgs[burg].state = newState;
    moveBurgToGroup(burg, "cities");

    if (d3.event.shiftKey === false) exitAddStateMode();

    const culture = cells.culture[center];
    const basename = center % 5 === 0 ? burgs[burg].name : Names.getCulture(culture);
    const name = Names.getState(basename, culture);
    const color = getRandomColor();
    const pole = cells.p[center];

    // generate emblem
    const cultureType = pack.cultures[culture].type;
    const coa = COA.generate(burgs[burg].coa, 0.4, null, cultureType);
    coa.shield = COA.getShield(culture, null);

    // update diplomacy and reverse relations
    const diplomacy = states.map(s => {
      if (!s.i || s.removed) return "x";
      if (!oldState) {
        s.diplomacy.push("Neutral");
        return "Neutral";
      }

      let relations = states[oldState].diplomacy[s.i]; // relations between Nth state and old overlord
      if (s.i === oldState) relations = "Enemy";
      // new state is Enemy to its old overlord
      else if (relations === "Ally") relations = "Suspicion";
      else if (relations === "Friendly") relations = "Suspicion";
      else if (relations === "Suspicion") relations = "Neutral";
      else if (relations === "Enemy") relations = "Friendly";
      else if (relations === "Rival") relations = "Friendly";
      else if (relations === "Vassal") relations = "Suspicion";
      else if (relations === "Suzerain") relations = "Enemy";
      s.diplomacy.push(relations);
      return relations;
    });
    diplomacy.push("x");
    states[0].diplomacy.push([`Independance declaration`, `${name} declared its independance from ${states[oldState].name}`]);

    cells.state[center] = newState;
    cells.province[center] = 0;

    states.push({
      i: newState,
      name,
      diplomacy,
      provinces: [],
      color,
      expansionism: 0.5,
      capital: burg,
      type: "Generic",
      center,
      culture,
      military: [],
      alert: 1,
      coa,
      pole
    });
    BurgsAndStates.collectStatistics();
    BurgsAndStates.defineStateForms([newState]);
    adjustProvinces([cells.province[center]]);

    if (layerIsOn("toggleProvinces")) toggleProvinces();
    if (!layerIsOn("toggleStates")) toggleStates();
    else drawStates();
    if (!layerIsOn("toggleBorders")) toggleBorders();
    else drawBorders();

    // add label
    defs
      .select("#textPaths")
      .append("path")
      .attr("d", `M${pole[0] - 50},${pole[1] + 6}h${100}`)
      .attr("id", "textPath_stateLabel" + newState);
    labels
      .select("#states")
      .append("text")
      .attr("id", "stateLabel" + newState)
      .append("textPath")
      .attr("xlink:href", "#textPath_stateLabel" + newState)
      .attr("startOffset", "50%")
      .attr("font-size", "50%")
      .append("tspan")
      .attr("x", name.length * -3)
      .text(name);

    COArenderer.add("state", newState, coa, states[newState].pole[0], states[newState].pole[1]);
    statesEditorAddLines();
  }

  function exitAddStateMode() {
    customization = 0;
    restoreDefaultEvents();
    clearMainTip();
    body.querySelectorAll("div > input, select, span, svg").forEach(e => (e.style.pointerEvents = "all"));
    if (statesAdd.classList.contains("pressed")) statesAdd.classList.remove("pressed");
  }

  function downloadStatesData() {
    const unit = areaUnit.value === "square" ? distanceUnitInput.value + "2" : areaUnit.value;
    let data =
      "Id,State,Full Name,Form,Color,Capital,Culture,Type,Expansionism,Cells,Burgs,Area " + unit + ",Total Population,Rural Population,Urban Population\n"; // headers
    body.querySelectorAll(":scope > div").forEach(function (el) {
      const key = parseInt(el.dataset.id);
      const statePack = pack.states[key];
      data += el.dataset.id + ",";
      data += el.dataset.name + ",";
      data += (statePack.fullName ? statePack.fullName : "") + ",";
      data += el.dataset.form + ",";
      data += el.dataset.color + ",";
      data += el.dataset.capital + ",";
      data += el.dataset.culture + ",";
      data += el.dataset.type + ",";
      data += el.dataset.expansionism + ",";
      data += el.dataset.cells + ",";
      data += el.dataset.burgs + ",";
      data += el.dataset.area + ",";
      data += el.dataset.population + ",";
      data += `${Math.round(statePack.rural * populationRate)},`;
      data += `${Math.round(statePack.urban * populationRate * urbanization)}\n`;
    });

    const name = getFileName("States") + ".csv";
    downloadFile(data, name);
  }

  function closeStatesEditor() {
    if (customization === 2) exitStatesManualAssignment("close");
    if (customization === 3) exitAddStateMode();
    debug.selectAll(".highlight").remove();
    body.innerHTML = "";
  }
}
