import io
from typing import List, Tuple
from datetime import datetime

# Setup headless backend before importing pyplot to avoid GUI dependencies
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

from src.utils.logger import get_logger

logger = get_logger(__name__)


class PriceChartGenerator:
    """
    Utility generating e-commerce price history trend charts 
    directly into in-memory byte buffers using Matplotlib.
    """

    @staticmethod
    def generate_chart(history: List[Tuple[datetime, float]], currency_symbol: str = "$") -> bytes:
        if not history:
            logger.warning("Empty history list provided to chart generator. Returning empty stream.")
            return b""

        logger.debug(f"Generating price chart for {len(history)} data points")
        
        # Sort history by date to ensure proper timeline progression
        sorted_history = sorted(history, key=lambda x: x[0])
        dates, prices = zip(*sorted_history)

        try:
            # Create a figure
            fig, ax = plt.subplots(figsize=(6, 3), dpi=150)

            # Plot line
            ax.plot(dates, prices, color="#4f46e5", linewidth=2, marker="o", markersize=4)

            # Area fill below curve
            ax.fill_between(dates, prices, min(prices) * 0.95, color="#818cf8", alpha=0.15)

            # Style adjustments
            ax.set_title("Price Trend History", fontsize=10, fontweight="bold", color="#1e293b", pad=10)
            ax.spines["top"].set_visible(False)
            ax.spines["right"].set_visible(False)
            ax.spines["left"].set_color("#cbd5e1")
            ax.spines["bottom"].set_color("#cbd5e1")
            ax.tick_params(colors="#64748b", labelsize=8)

            # Format Y Axis
            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f"{currency_symbol}{x:.2f}"))

            # Format X Axis
            ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
            ax.xaxis.set_major_locator(mdates.AutoDateLocator())
            plt.xticks(rotation=30)

            plt.tight_layout()

            # Save to bytes
            buf = io.BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight")
            buf.seek(0)
            
            # Close figure to release RAM memory leaks
            plt.close(fig)
            
            return buf.getvalue()
            
        except Exception as e:
            logger.error(f"Error rendering Matplotlib chart: {e}")
            return b""

