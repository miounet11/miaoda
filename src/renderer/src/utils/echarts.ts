import * as echarts from 'echarts'

// Register necessary charts and components
import 'echarts/lib/chart/line'
import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/pie'
import 'echarts/lib/chart/radar'
import 'echarts/lib/component/title'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/grid'
import 'echarts/lib/component/polar'
import 'echarts/lib/component/dataZoom'

// Dark theme configuration
const darkTheme = {
  color: [
    '#3B82F6',
    '#10B981',
    '#8B5CF6',
    '#F59E0B',
    '#EF4444',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6366F1'
  ],
  backgroundColor: '#1F2937',
  textStyle: {
    color: '#F3F4F6',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  title: {
    textStyle: {
      color: '#F3F4F6'
    },
    subtextStyle: {
      color: '#9CA3AF'
    }
  },
  line: {
    itemStyle: {
      borderWidth: 2
    },
    lineStyle: {
      width: 3
    },
    symbolSize: 6,
    symbol: 'circle',
    smooth: true
  },
  radar: {
    itemStyle: {
      borderWidth: 2
    },
    lineStyle: {
      width: 2
    },
    symbolSize: 6,
    symbol: 'circle',
    smooth: true
  },
  bar: {
    itemStyle: {
      borderRadius: [4, 4, 0, 0]
    }
  },
  pie: {
    itemStyle: {
      borderRadius: 5,
      borderColor: '#1F2937',
      borderWidth: 2
    }
  },
  scatter: {
    itemStyle: {
      borderWidth: 2
    }
  },
  boxplot: {
    itemStyle: {
      borderWidth: 2
    }
  },
  parallel: {
    itemStyle: {
      borderWidth: 2
    }
  },
  sankey: {
    itemStyle: {
      borderWidth: 2
    }
  },
  funnel: {
    itemStyle: {
      borderWidth: 2
    }
  },
  gauge: {
    itemStyle: {
      borderWidth: 2
    }
  },
  candlestick: {
    itemStyle: {
      color: '#10B981',
      color0: '#EF4444',
      borderColor: '#10B981',
      borderColor0: '#EF4444',
      borderWidth: 2
    }
  },
  graph: {
    itemStyle: {
      borderWidth: 2
    },
    lineStyle: {
      width: 2
    },
    symbolSize: 6,
    symbol: 'circle'
  },
  map: {
    itemStyle: {
      borderColor: '#374151',
      borderWidth: 1
    },
    areaStyle: {
      color: '#4B5563'
    }
  },
  geo: {
    itemStyle: {
      borderColor: '#374151',
      borderWidth: 1
    },
    areaStyle: {
      color: '#4B5563'
    }
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisLabel: {
      show: true,
      color: '#9CA3AF'
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#374151']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['#4B5563', '#374151']
      }
    }
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisLabel: {
      show: true,
      color: '#9CA3AF'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#374151']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['#4B5563', '#374151']
      }
    }
  },
  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisLabel: {
      show: true,
      color: '#9CA3AF'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#374151']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['#4B5563', '#374151']
      }
    }
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#4B5563'
      }
    },
    axisLabel: {
      show: true,
      color: '#9CA3AF'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#374151']
      }
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['#4B5563', '#374151']
      }
    }
  },
  toolbox: {
    iconStyle: {
      borderColor: '#9CA3AF'
    },
    emphasis: {
      iconStyle: {
        borderColor: '#F3F4F6'
      }
    }
  },
  legend: {
    textStyle: {
      color: '#9CA3AF'
    }
  },
  tooltip: {
    axisPointer: {
      lineStyle: {
        color: '#4B5563',
        width: 1
      },
      crossStyle: {
        color: '#4B5563',
        width: 1
      }
    }
  },
  timeline: {
    lineStyle: {
      color: '#4B5563',
      width: 1
    },
    itemStyle: {
      color: '#6B7280',
      borderWidth: 1
    },
    controlStyle: {
      color: '#9CA3AF',
      borderColor: '#9CA3AF',
      borderWidth: 1
    },
    checkpointStyle: {
      color: '#3B82F6',
      borderColor: '#1D4ED8'
    },
    label: {
      color: '#9CA3AF'
    },
    emphasis: {
      itemStyle: {
        color: '#9CA3AF'
      },
      controlStyle: {
        color: '#9CA3AF',
        borderColor: '#9CA3AF',
        borderWidth: 1
      },
      label: {
        color: '#9CA3AF'
      }
    }
  },
  visualMap: {
    color: ['#EF4444', '#F59E0B', '#10B981']
  },
  dataZoom: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    dataBackgroundColor: 'rgba(107, 114, 128, 0.3)',
    fillerColor: 'rgba(59, 130, 246, 0.2)',
    handleColor: '#9CA3AF',
    handleSize: '100%',
    textStyle: {
      color: '#9CA3AF'
    }
  },
  markPoint: {
    label: {
      color: '#F3F4F6'
    },
    emphasis: {
      label: {
        color: '#F3F4F6'
      }
    }
  }
}

// Register dark theme
echarts.registerTheme('dark', darkTheme)

// Default configuration function
export function getDefaultChartOptions(isDark = false) {
  return {
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: isDark ? '#F3F4F6' : '#374151'
      },
      extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
    },
    legend: {
      top: 'top',
      textStyle: {
        color: isDark ? '#9CA3AF' : '#6B7280'
      }
    }
  }
}

export { echarts }
export default echarts
