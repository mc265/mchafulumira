const startYear = 1961,
    endYear = 2021,
    btn = document.getElementById('play-pause-button'),
    input = document.getElementById('play-range'),
    nbr = 20;

let dataset, chart;


/*
 * Animate dataLabels functionality
 */
(function (H) {
    const FLOAT = /^-?\d+\.?\d*$/;

    // Add animated textSetter, just like fill/strokeSetters
    H.Fx.prototype.textSetter = function () {
        let startValue = this.start.replace(/ /g, ''),
            endValue = this.end.replace(/ /g, ''),
            currentValue = this.end.replace(/ /g, '');

        if ((startValue || '').match(FLOAT)) {
            startValue = parseInt(startValue, 10);
            endValue = parseInt(endValue, 10);

            // No support for float
            currentValue = Highcharts.numberFormat(
                Math.round(startValue + (endValue - startValue) * this.pos),
                0
            );
        }

        this.elem.endText = this.end;

        this.elem.attr(this.prop, currentValue, null, true);
    };

    // Add textGetter, not supported at all at this moment:
    H.SVGElement.prototype.textGetter = function () {
        const ct = this.text.element.textContent || '';
        return this.endText ? this.endText : ct.substring(0, ct.length / 2);
    };

    // Temporary change label.attr() with label.animate():
    // In core it's simple change attr(...) => animate(...) for text prop
    H.wrap(H.Series.prototype, 'drawDataLabels', function (proceed) {
        const attr = H.SVGElement.prototype.attr,
            chart = this.chart;

        if (chart.sequenceTimer) {
            this.points.forEach(point =>
                (point.dataLabels || []).forEach(
                    label =>
                        (label.attr = function (hash) {
                            if (hash && hash.text !== undefined) {
                                const text = hash.text;

                                delete hash.text;

                                return this
                                    .attr(hash)
                                    .animate({ text });
                            }
                            return attr.apply(this, arguments);

                        })
                )
            );
        }

        const ret = proceed.apply(
            this,
            Array.prototype.slice.call(arguments, 1)
        );

        this.points.forEach(p =>
            (p.dataLabels || []).forEach(d => (d.attr = attr))
        );

        return ret;
    });
}(Highcharts));


function getData(year) {
    const output = Object.entries(dataset)
        .map(country => {
            const [countryName, countryData] = country;
            return [countryName, Number(countryData[year])];
        })
        .sort((a, b) => b[1] - a[1]);
    return [output[0], output.slice(0, nbr)];
}

function getSubtitle() {
    const population = (getData(input.value)[0][1] / 1).toFixed(0);
    return `<span style="font-size: 80px">${input.value}</span>
        <br>
        <span style="font-size: 22px">
            Total<b>: ${population}</b>m3
        </span>`;
}

(async () => {

    dataset = await fetch(
        'https://raw.githubusercontent.com/mc265/Industrial-Roundwood-Production-over-Time/main/data%20for%20bar%20race.json'
    ).then(response => response.json());


    chart = Highcharts.chart('container', {
        chart: {
            animation: {
                duration: 500
            },
            marginRight: 50
        },
        title: {
            text: 'Industrial Roundwood Production',
            align: 'left'
        },
        subtitle: {
            useHTML: true,
            text: getSubtitle(),
            floating: true,
            align: 'right',
            verticalAlign: 'middle',
            y: 100,
            x: -100
        },

        legend: {
            enabled: false
        },
 xAxis: { title: {
            enabled: true,
            text: ''
        },
       
            type: 'category' 
         },  
     

        yAxis: {
            opposite: true,
            tickPixelInterval: 150,
            min:0,
            max:300000000,
            tickInterval: 50000000,
            title: {
                text: 'Production(m3)'
            }
        },
        plotOptions: {
            series: {
                animation: false,
                groupPadding: 0,
                pointPadding: 0.1,
                borderWidth: 0,
                colorByPoint: true,
                dataSorting: {
                    enabled: true,
                    matchByName: true
                },
                type: 'bar',
                dataLabels: {
                    enabled: true
                }
            }
        },
       
       
     
        series: [
            {
                type: 'bar',
                name: startYear,
                data: getData(startYear)[1]
            }
        ],
         credits: {
        enabled: false
    },
      scrollbar: {
            enabled: true
        },

        responsive: {
            rules: [{
                condition: {
                    maxWidth: 550
                },
                chartOptions: {
                    xAxis: {
                        visible: true
                    },
                    subtitle: {
                        x: 0
                    },
                    plotOptions: {
                        series: {
                            dataLabels: [{
                                enabled: true,
                                y: 8
                            }, {
                                enabled: true,
                                format: '{point.name}',
                                y: -8,
                                style: {
                                    fontWeight: 'normal',
                                    opacity: 0.7
                                }
                            }]
                        }
                    }
                }
            }]
        }
    });
})();

/*
 * Pause the timeline, either when the range is ended, or when clicking the pause button.
 * Pausing stops the timer and resets the button to play mode.
 */
function pause(button) {
    button.title = 'play';
    button.className = 'fa fa-play';
    clearTimeout(chart.sequenceTimer);
    chart.sequenceTimer = undefined;
}

/*
 * Update the chart. This happens either on updating (moving) the range input,
 * or from a timer when the timeline is playing.
 */
function update(increment) {
    if (increment) {
        input.value = parseInt(input.value, 10) + increment;
    }
    if (input.value >= endYear) {
        // Auto-pause
        pause(btn);
    }

    chart.update(
        {
            subtitle: {
                text: getSubtitle()
            }
        },
        true,
        true,
        true
    );

    chart.series[0].update({
        name: input.value,
        data: getData(input.value)[1]
    });
}

/*
 * Play the timeline.
 */
function play(button) {
    button.title = 'pause';
    button.className = 'fa fa-pause';
    chart.sequenceTimer = setInterval(function () {
        update(1);
    }, 1000);
}

btn.addEventListener('click', function () {
    if (chart.sequenceTimer) {
        pause(this);
    } else {
        play(this);
    }
});
/*
 * Trigger the update on the range bar click.
 */
input.addEventListener('click', function () {
    update();
});
