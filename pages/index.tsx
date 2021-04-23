import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import * as d3 from "d3";
import tippy, { followCursor } from 'tippy.js';
import ReactDOMServer from 'react-dom/server';
import 'tippy.js/animations/scale-subtle.css';

export default function Home(props: { data1: any, data2: any, data3: any }) {

  const [menuOption, setmenuOption] = useState(props.data1)
  const [title, settitle] = useState('')

  useEffect(function(){
    settitle(menuOption.id);
  })

  function handleMenuButton(args) {
    switch (args) {
      case 1: setmenuOption(props.data1); break;
      case 2: setmenuOption(props.data2); break;
      case 3: setmenuOption(props.data3); break;
      default: break;
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{marginTop: '10px'}}>
        <button style={{margin: '5px'}} onClick={() => handleMenuButton(1)}>⚡ Kickstarter</button>
        <button style={{margin: '5px'}} onClick={() => handleMenuButton(2)}>🎥 Movies</button>
        <button style={{margin: '5px'}} onClick={() => handleMenuButton(3)}>🎮 Video Games</button>
      </div>
      <h1 style={{margin: '10px'}}>{title}</h1>
      <div style={{ height: '370px', width: '90vw', margin: 'auto' }}>
        <GamesGraphic data={menuOption} />
      </div>

    </div>
  )
}

function GamesGraphic(props: { data: any }) {

  const [forceRender, setforceRender] = useState<number>(Math.random());

  const graphicRef = useRef<HTMLEmbedElement>(null);
  const legendRef = useRef<HTMLEmbedElement>(null);

  //@ts-ignore
  const names: Array<string> = props.data.children.map((val: Array<{ name: string }>) => val.name);

  useEffect(function () {

    const svgHeight = graphicRef.current.clientHeight
    const svgWidth = graphicRef.current.clientWidth

    var fader = function (color: string | d3.ColorCommonInstance) {
      return d3.interpolateRgb(color, '#fff')(0.2);
    },
      color = d3.scaleOrdinal(d3.schemeCategory10.map(fader));

    var treemap = d3.treemap().size([svgWidth, svgHeight]).paddingInner(1);

    var root = d3
      .hierarchy(props.data)
      .eachBefore(function (d) {
        d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name;
      })
      .sum((d) => d.value)
      .sort(function (a, b) {
        return b.height - a.height || b.value - a.value;
      });

    treemap(root);

    const svg = d3.select(graphicRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')

    var cell = svg
      .selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('transform', function (d) {
        //@ts-ignore
        return 'translate(' + d.x0 + ',' + d.y0 + ')';
      });

    cell
      .append('rect')
      .attr('id', function (d) {
        return d.data.id;
      })
      .attr('class', 'tile')
      .attr('width', function (d) {
        //@ts-ignore
        return d.x1 - d.x0;
      })
      .attr('height', function (d) {
        //@ts-ignore
        return d.y1 - d.y0;
      })
      .attr('data-name', function (d) {
        return d.data.name;
      })
      .attr('data-category', function (d) {
        return d.data.category;
      })
      .attr('data-value', function (d) {
        return d.data.value;
      })
      .attr('fill', function (d) {
        return color(d.data.category);
      })

    cell.append('text')
      .attr('font-size', '10px')
      .selectAll('tspan')
      .data((d) => d.data.name.split(/(?= [A-Z])/g))
      .enter().append('tspan')
      .attr('x', 4)
      .attr('y', function (d, i) {
        return 13 + i * 10;
      })
      .text((d: any) => d)

    d3.selectAll('rect').nodes().forEach(function (val: SVGElement) {
      tippy(val, {
        allowHTML: true,
        animation: 'scale-subtle',
        followCursor: true,
        content: ReactDOMServer.renderToStaticMarkup(
          <div style={{ margin: '0px', padding: '5px', color: 'black', boxShadow: ' 0px 0px 25px 0px rgba(0,0,0,0.8)', backgroundColor: val.attributes[7].value.replace('rgb', 'rgba').replace(')', ',0.9)') }}>
            <p style={{ margin: '0px', fontSize: '0.8rem' }}>Name: {val.attributes[4].value}</p>
            <p style={{ margin: '0px', fontSize: '0.8rem' }}>Category: {val.attributes[5].value}</p>
            <p style={{ margin: '0px', fontSize: '0.8rem' }}>Value: {Number(val.attributes[3].value).toFixed(2)}</p>
          </div>
        ),
        plugins: [followCursor]
      }).unmount();
    })

    const namesAndColors = names.map(function (val1) {
      const rectSample =
        d3.selectAll('rect')
          .nodes()
          .find((val2: SVGElement) => val2.attributes[5].value === val1)
      const returnedObj = {};
      //@ts-ignore
      returnedObj['name'] = rectSample.attributes[5].value;
      //@ts-ignore
      returnedObj['color'] = rectSample.attributes[7].value;
      return returnedObj
    });

    const legend = d3.select(legendRef.current)
      .selectAll('div')
      .data(namesAndColors)
      .enter().append('div')
      .attr('style', 'display: flex; align-items: center; height: 40px; width: 110px; margin: 3px')

    legend.append('div')
      //@ts-ignore
      .attr('style', (d) => 'height: 10px; width: 10px; margin-right: 5px; background-color: ' + d.color + ';')

    legend.append('p')
      //@ts-ignore
      .text((d) => d.name)

    return (function () {
      svg.remove()
      legend.remove()
    })
  })

  useEffect(function () {
    window.addEventListener('resize', () => setforceRender(Math.random()));
  }, [])

  return (
    <>
      <div ref={graphicRef} style={{ height: '100%', width: '100%' }} />
      <div ref={legendRef} style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }} />
    </>
  )
}

export async function getStaticProps() {
  const res1 = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json');
  const res2 = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json');
  const res3 = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json');
  const data1 = await res1.json();
  const data2 = await res2.json();
  const data3 = await res3.json();

  return {
    props: { data1, data2, data3 }, // will be passed to the page component as props
  }
}