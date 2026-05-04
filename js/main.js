(function () {
  "use strict";

  const NUMERIC_COLS = [
    "Monthly_Production_Tonnes",
    "Avg_Item_Price_USD",
    "Release_Cycles_Per_Year",
    "Carbon_Emissions_tCO2e",
    "Water_Usage_Million_Litres",
    "Landfill_Waste_Tonnes",
    "Avg_Worker_Wage_USD",
    "Working_Hours_Per_Week",
    "Child_Labor_Incidents",
    "Return_Rate_Percent",
    "Avg_Spend_Per_Customer_USD",
    "Shopping_Frequency_Per_Year",
    "Instagram_Mentions_Thousands",
    "TikTok_Mentions_Thousands",
    "Sentiment_Score",
    "GDP_Contribution_Million_USD",
    "Env_Cost_Index",
    "Sustainability_Score",
    "Transparency_Index",
    "Compliance_Score",
    "Ethical_Rating",
  ];

  const VIEWS = {
    environmental: {
      title: "Environmental Cost by Brand",
      description:
        "How much environmental damage does each brand cause? " +
        "This chart compares average CO\u2082 emissions, water consumption, " +
        "and landfill waste across brands in the filtered dataset.",
      chartType: "bar-multiples",
      metrics: [
        { field: "Carbon_Emissions_tCO2e", label: "Carbon Emissions (tCO\u2082e)", color: "#ef4444" },
        { field: "Water_Usage_Million_Litres", label: "Water Usage (M Litres)", color: "#3b82f6" },
        { field: "Landfill_Waste_Tonnes", label: "Landfill Waste (tonnes)", color: "#f59e0b" },
      ],
      summary: [
        { label: "Avg Carbon (tCO\u2082e)", field: "Carbon_Emissions_tCO2e" },
        { label: "Avg Water (M L)", field: "Water_Usage_Million_Litres" },
        { label: "Avg Landfill (t)", field: "Landfill_Waste_Tonnes" },
        { label: "Avg Env Cost Index", field: "Env_Cost_Index" },
      ],
      takeaway:
        "Fast fashion\u2019s environmental burden extends far beyond carbon emissions. " +
        "Water consumption and landfill waste reveal the full lifecycle cost of cheap clothing \u2014 " +
        "from resource-intensive production to mountains of post-consumer waste.",
    },
    human: {
      title: "Human Cost: Wages vs. Working Hours",
      description:
        "What do garment workers actually earn, and how many hours do they work? " +
        "Each dot is one brand\u2013country\u2013year record, colored by producing country.",
      chartType: "scatter",
      xField: "Avg_Worker_Wage_USD",
      xLabel: "Avg Worker Wage ($)",
      yField: "Working_Hours_Per_Week",
      yLabel: "Working Hours / Week",
      colorField: "Country",
      tooltipFields: [
        { label: "Worker Wage", field: "Avg_Worker_Wage_USD", prefix: "$" },
        { label: "Hours / Week", field: "Working_Hours_Per_Week" },
        { label: "Child Labor Incidents", field: "Child_Labor_Incidents" },
        { label: "Compliance Score", field: "Compliance_Score" },
        { label: "Ethical Rating", field: "Ethical_Rating" },
      ],
      summary: [
        { label: "Avg Wage ($)", field: "Avg_Worker_Wage_USD" },
        { label: "Avg Hours / Week", field: "Working_Hours_Per_Week" },
        { label: "Avg Child Labor Inc.", field: "Child_Labor_Incidents" },
        { label: "Avg Ethical Rating", field: "Ethical_Rating" },
      ],
      takeaway:
        "Low wages and long working hours are pervasive across garment-producing countries. " +
        "The data reveals a consistent pattern: the cheaper the labor, the more hours workers " +
        "are expected to put in \u2014 often exceeding international labor standards.",
    },
    financial: {
      title: "Financial Cost: Price vs. Sustainability",
      description:
        "How does a garment\u2019s retail price relate to its sustainability score? " +
        "Each dot is one brand\u2013country\u2013year record, colored by brand.",
      chartType: "scatter",
      xField: "Avg_Item_Price_USD",
      xLabel: "Avg Item Price ($)",
      yField: "Sustainability_Score",
      yLabel: "Sustainability Score",
      colorField: "Brand",
      tooltipFields: [
        { label: "Item Price", field: "Avg_Item_Price_USD", prefix: "$" },
        { label: "Sustainability", field: "Sustainability_Score" },
        { label: "Customer Spend", field: "Avg_Spend_Per_Customer_USD", prefix: "$" },
        { label: "Transparency", field: "Transparency_Index" },
        { label: "Ethical Rating", field: "Ethical_Rating" },
      ],
      summary: [
        { label: "Avg Item Price ($)", field: "Avg_Item_Price_USD" },
        { label: "Avg Customer Spend ($)", field: "Avg_Spend_Per_Customer_USD" },
        { label: "Avg Sustainability", field: "Sustainability_Score" },
        { label: "Avg Transparency", field: "Transparency_Index" },
      ],
      takeaway:
        "Retail prices often mask the true production cost. Brands with the lowest price tags " +
        "rarely score well on sustainability or transparency \u2014 the financial savings are " +
        "passed on as environmental and human costs.",
    },
  };

  const BRAND_SHAPES = {
    "Forever 21": d3.symbolDiamond,
    "H&M": d3.symbolSquare,
    "Shein": d3.symbolTriangle,
    "Uniqlo": d3.symbolCircle,
    "Zara": d3.symbolStar,
  };

  function cssVar(name) {
    return "hsl(" + getComputedStyle(document.documentElement).getPropertyValue(name).trim() + ")";
  }

  let currentView = "environmental";
  let allData = [];
  let filteredData = [];

  const brandFilt = d3.select("#brand-filter");
  const countryFilt = d3.select("#country-filter");
  const yearMinEl = document.getElementById("year-min");
  const yearMaxEl = document.getElementById("year-max");
  const tooltip = d3.select("#tooltip");
  const chartPanel = d3.select("#chart-panel");

  document.querySelectorAll(".view-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.view;
      document.querySelectorAll(".view-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  d3.csv("data/true_cost_fast_fashion.csv")
    .then((raw) => {
      allData = raw.map((d) => {
        const row = {};
        for (const key of Object.keys(d)) {
          row[key] = NUMERIC_COLS.includes(key) ? +d[key] : d[key];
        }
        row.Year = +d.Year;
        return row;
      });

      const brands = [...new Set(allData.map((d) => d.Brand))].sort();
      const countries = [...new Set(allData.map((d) => d.Country))].sort();
      brands.forEach((b) => brandFilt.append("option").attr("value", b).text(b));
      countries.forEach((c) => countryFilt.append("option").attr("value", c).text(c));

      const years = d3.extent(allData, (d) => d.Year);
      yearMinEl.value = 2023;
      yearMaxEl.value = 2024;
      countryFilt.property("value", "USA");
      yearMinEl.min = years[0];
      yearMinEl.max = years[1];
      yearMaxEl.min = years[0];
      yearMaxEl.max = years[1];

      bindControls();
      applyFilters();
    })
    .catch(() => {
      chartPanel.html(
        '<div class="py-16 text-center text-muted-foreground">' +
          "Could not load " +
          '<code class="rounded bg-muted px-1.5 py-0.5 text-xs">data/true_cost_fast_fashion.csv</code>.' +
          "</div>"
      );
    });

  function bindControls() {
    brandFilt.on("change", applyFilters);
    countryFilt.on("change", applyFilters);
    yearMinEl.addEventListener("change", applyFilters);
    yearMaxEl.addEventListener("change", applyFilters);
  }

  function applyFilters() {
    const brand = brandFilt.property("value");
    const country = countryFilt.property("value");
    const yMin = +yearMinEl.value || -Infinity;
    const yMax = +yearMaxEl.value || Infinity;

    filteredData = allData.filter((d) => {
      if (brand !== "ALL" && d.Brand !== brand) return false;
      if (country !== "ALL" && d.Country !== country) return false;
      if (d.Year < yMin || d.Year > yMax) return false;
      return true;
    });

    render();
  }

  function render() {
    const view = VIEWS[currentView];

    document.getElementById("chart-title").textContent = view.title;
    document.getElementById("chart-desc").textContent = view.description;

    chartPanel.html("");

    if (filteredData.length === 0) {
      chartPanel.html(
        '<div class="py-16 text-center text-muted-foreground">No records match the current filters.</div>'
      );
      updateSummary(view);
      return;
    }

    if (view.chartType === "bar-multiples") {
      renderBarMultiples(view);
    } else {
      renderScatter(view);
    }

    updateSummary(view);
  }

  /* ------------------------------------------------------------------ */
  /*  Environmental: small-multiple horizontal bar charts by brand       */
  /* ------------------------------------------------------------------ */
  function renderBarMultiples(view) {
    const brandMap = d3.rollup(
      filteredData,
      (rows) => {
        const agg = { count: rows.length };
        view.metrics.forEach((m) => {
          agg[m.field] = d3.mean(rows, (d) => d[m.field]);
        });
        return agg;
      },
      (d) => d.Brand
    );

    const brands = [...brandMap.keys()].sort();
    const brandData = brands.map((b) => ({ brand: b, ...brandMap.get(b) }));

    const metricCount = view.metrics.length;
    const sectionH = Math.max(brands.length * 28 + 20, 100);
    const gap = 44;
    const m = { top: 30, right: 40, bottom: 24, left: 110 };
    const fullW = 780;
    const fullH = m.top + metricCount * sectionH + (metricCount - 1) * gap + m.bottom;
    const innerW = fullW - m.left - m.right;

    const svg = chartPanel
      .append("svg")
      .attr("viewBox", `0 0 ${fullW} ${fullH}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("class", "w-full h-auto block");

    const yBand = d3.scaleBand().domain(brands).range([0, sectionH]).padding(0.2);

    view.metrics.forEach((metric, i) => {
      const offsetY = m.top + i * (sectionH + gap);
      const section = svg.append("g").attr("transform", `translate(${m.left},${offsetY})`);

      const maxVal = d3.max(brandData, (d) => d[metric.field]) || 1;
      const xScale = d3.scaleLinear().domain([0, maxVal]).nice().range([0, innerW]);

      section
        .append("text")
        .attr("x", 0)
        .attr("y", -8)
        .attr("text-anchor", "start")
        .attr("fill", metric.color)
        .attr("font-size", "0.72rem")
        .attr("font-weight", "600")
        .text(metric.label);

      section
        .selectAll(".bar")
        .data(brandData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", (d) => yBand(d.brand))
        .attr("width", 0)
        .attr("height", yBand.bandwidth())
        .attr("fill", metric.color)
        .attr("opacity", 0.8)
        .attr("rx", 3)
        .on("mouseenter", (event, d) => {
          tooltip
            .classed("opacity-0", false)
            .classed("opacity-100", true)
            .html(
              `<div class="font-semibold mb-1">${d.brand}</div>` +
                `<div class="flex justify-between gap-4"><span class="text-muted-foreground">${metric.label}</span><span>${fmt(d[metric.field])}</span></div>` +
                `<div class="flex justify-between gap-4"><span class="text-muted-foreground">Records</span><span>${d.count}</span></div>`
            );
        })
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip)
        .transition()
        .duration(500)
        .attr("width", (d) => xScale(d[metric.field] || 0));

      section
        .selectAll(".val-label")
        .data(brandData)
        .enter()
        .append("text")
        .attr("x", (d) => xScale(d[metric.field] || 0) + 5)
        .attr("y", (d) => yBand(d.brand) + yBand.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("fill", cssVar("--muted-foreground"))
        .attr("font-size", "0.6rem")
        .attr("opacity", 0)
        .text((d) => fmt(d[metric.field]))
        .transition()
        .delay(400)
        .duration(200)
        .attr("opacity", 1);

      section
        .selectAll(".brand-label")
        .data(brandData)
        .enter()
        .append("text")
        .attr("x", -8)
        .attr("y", (d) => yBand(d.brand) + yBand.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", cssVar("--foreground"))
        .attr("font-size", "0.65rem")
        .text((d) => d.brand);

      const xAxisG = section
        .append("g")
        .attr("transform", `translate(0,${sectionH})`);
      xAxisG.call(d3.axisBottom(xScale).ticks(5));
      xAxisG.selectAll("text").attr("fill", cssVar("--muted-foreground")).attr("font-size", "0.6rem");
      xAxisG.select(".domain").attr("stroke", cssVar("--border"));
      xAxisG.selectAll(".tick line").attr("stroke", cssVar("--border"));
    });

    d3.select("#legend").html("");
  }

  /* ------------------------------------------------------------------ */
  /*  Human / Financial: scatterplot                                     */
  /* ------------------------------------------------------------------ */
  function renderScatter(view) {
    const m = { top: 20, right: 20, bottom: 50, left: 60 };
    const fullW = 780;
    const fullH = 500;
    const w = fullW - m.left - m.right;
    const h = fullH - m.top - m.bottom;

    const svg = chartPanel
      .append("svg")
      .attr("viewBox", `0 0 ${fullW} ${fullH}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("class", "w-full h-auto block");

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d[view.xField]))
      .nice()
      .range([0, w]);
    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d[view.yField]))
      .nice()
      .range([h, 0]);

    const groups = [...new Set(filteredData.map((d) => d[view.colorField]))].sort();
    const colorScale = d3.scaleOrdinal().domain(groups).range(d3.schemeTableau10);

    const tickColor = cssVar("--muted-foreground");
    const axisColor = cssVar("--border");

    const xAxisG = g
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(xScale).ticks(8));
    xAxisG.selectAll("line, path").attr("stroke", axisColor);
    xAxisG.selectAll("text").attr("fill", tickColor).attr("font-size", "0.65rem");

    const yAxisG = g.append("g").call(d3.axisLeft(yScale).ticks(8));
    yAxisG.selectAll("line, path").attr("stroke", axisColor);
    yAxisG.selectAll("text").attr("fill", tickColor).attr("font-size", "0.65rem");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", m.left + w / 2)
      .attr("y", fullH - 6)
      .attr("fill", tickColor)
      .attr("font-size", "0.75rem")
      .text(view.xLabel);

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(14,${m.top + h / 2}) rotate(-90)`)
      .attr("fill", tickColor)
      .attr("font-size", "0.75rem")
      .text(view.yLabel);

    const symbolGen = d3.symbol().size(52);

    g.selectAll(".dot")
      .data(filteredData)
      .enter()
      .append("path")
      .attr("class", "dot")
      .attr("d", (d) => symbolGen.type(BRAND_SHAPES[d.Brand] || d3.symbolCircle)())
      .attr("transform", (d) => `translate(${xScale(d[view.xField])},${yScale(d[view.yField])})`)
      .attr("fill", (d) => colorScale(d[view.colorField]))
      .attr("opacity", 0)
      .on("mouseenter", (event, d) => {
        let html = `<div class="font-semibold mb-1">${d.Brand} &mdash; ${d.Country} (${d.Year})</div>`;
        view.tooltipFields.forEach((tf) => {
          const val = tf.prefix ? tf.prefix + fmt(d[tf.field]) : fmt(d[tf.field]);
          html += `<div class="flex justify-between gap-4"><span class="text-muted-foreground">${tf.label}</span><span>${val}</span></div>`;
        });
        tooltip.classed("opacity-0", false).classed("opacity-100", true).html(html);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip)
      .transition()
      .duration(500)
      .attr("opacity", 0.7);

    renderLegend(groups, colorScale);
  }

  /* ------------------------------------------------------------------ */
  /*  Shared helpers                                                     */
  /* ------------------------------------------------------------------ */
  function renderLegend(groups, scale) {
    const container = d3.select("#legend");
    container.html("");

    const colorIsBrand = groups.every((g) => BRAND_SHAPES[g] !== undefined);

    groups.forEach((grp) => {
      const item = container
        .append("span")
        .attr(
          "class",
          "inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        );

      const icon = item
        .append("svg")
        .attr("width", 14)
        .attr("height", 14)
        .attr("viewBox", "-7 -7 14 14")
        .attr("class", "shrink-0");

      if (colorIsBrand && BRAND_SHAPES[grp]) {
        icon
          .append("path")
          .attr("d", d3.symbol().type(BRAND_SHAPES[grp]).size(70)())
          .attr("fill", scale(grp));
      } else {
        icon.append("circle").attr("r", 5).attr("fill", scale(grp));
      }

      item.append("span").text(grp);
    });

    if (!colorIsBrand) {
      container
        .append("span")
        .attr("class", "ml-3 mr-1 text-muted-foreground/40 select-none")
        .text("|");

      const brands = Object.keys(BRAND_SHAPES).sort();
      brands.forEach((brand) => {
        const item = container
          .append("span")
          .attr(
            "class",
            "inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          );

        item
          .append("svg")
          .attr("width", 14)
          .attr("height", 14)
          .attr("viewBox", "-7 -7 14 14")
          .attr("class", "shrink-0")
          .append("path")
          .attr("d", d3.symbol().type(BRAND_SHAPES[brand]).size(70)())
          .attr("fill", cssVar("--muted-foreground"));

        item.append("span").text(brand);
      });
    }
  }

  function updateSummary(view) {
    const grid = d3.select("#summary-grid");
    grid.html("");
    const n = filteredData.length;

    if (n === 0) {
      grid
        .append("div")
        .attr("class", "col-span-2 rounded-md bg-muted p-3")
        .html(
          '<div class="text-[11px] uppercase tracking-wider text-muted-foreground">No Data</div>' +
            '<div class="text-lg font-semibold">&mdash;</div>'
        );
      d3.select("#takeaway").html("");
      return;
    }

    view.summary.forEach((s) => {
      const val = fmt(d3.mean(filteredData, (d) => d[s.field]));
      grid
        .append("div")
        .attr("class", "rounded-md bg-muted p-3")
        .html(
          `<div class="text-[11px] uppercase tracking-wider text-muted-foreground">${s.label}</div>` +
            `<div class="text-lg font-semibold">${val}</div>`
        );
    });

    d3.select("#takeaway").html(
      `<p>${view.takeaway}</p>` +
        `<p class="mt-2 text-xs text-muted-foreground/70">${n.toLocaleString()} records in current filter</p>`
    );
  }

  function moveTooltip(event) {
    tooltip
      .style("left", event.pageX + 14 + "px")
      .style("top", event.pageY - 10 + "px");
  }

  function hideTooltip() {
    tooltip.classed("opacity-100", false).classed("opacity-0", true);
  }

  function fmt(v) {
    if (v == null || isNaN(v)) return "\u2014";
    return Number.isInteger(v)
      ? v.toLocaleString()
      : (+v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
})();
