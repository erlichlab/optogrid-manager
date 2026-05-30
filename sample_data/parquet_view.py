import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import os
from tkinter import filedialog, Tk

def plot_parquet_data():
    """Load and plot data from a user-selected parquet file"""
    
    # Hide the main tkinter window
    root = Tk()
    root.withdraw()
    
    # Get the data directory path
    data_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Open file dialog to select parquet file
    file_path = filedialog.askopenfilename(
        title="Select Parquet File",
        filetypes=[("Parquet files", "*.parquet"), ("All files", "*.*")],
        initialdir=data_dir
    )
    
    if not file_path:
        print("No file selected")
        return
    
    try:
        # Load parquet file
        print(f"Loading: {file_path}")
        df = pd.read_parquet(file_path)
        
        # Sort by sample column to ensure proper order
        df = df.sort_values('sample').reset_index(drop=True)
        
        print(f"Data shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print(f"Sample count: {len(df)}")
        
        # Create subplots
        fig, axes = plt.subplots(2, 3, figsize=(18, 10))
        fig.suptitle(f'OptoGrid IMU Data - {file_path.split("/")[-1]}', fontsize=16)
        
        # Plot 1: Accelerometer data
        axes[0, 0].plot(df['acc_x'], label='X', alpha=0.7)
        axes[0, 0].plot(df['acc_y'], label='Y', alpha=0.7)
        axes[0, 0].plot(df['acc_z'], label='Z', alpha=0.7)
        axes[0, 0].set_title('Accelerometer (Raw)')
        axes[0, 0].set_xlabel('Sample')
        axes[0, 0].set_ylabel('Raw Value')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # Plot 2: Gyroscope data
        axes[0, 1].plot(df['gyro_x'], label='X', alpha=0.7)
        axes[0, 1].plot(df['gyro_y'], label='Y', alpha=0.7)
        axes[0, 1].plot(df['gyro_z'], label='Z', alpha=0.7)
        axes[0, 1].set_title('Gyroscope (Raw)')
        axes[0, 1].set_xlabel('Sample')
        axes[0, 1].set_ylabel('Raw Value')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # Plot 3: Sample continuity check
        sample_diff = np.diff(df['sample'])
        expected_diff = 1
        missing_samples = np.where(sample_diff != expected_diff)[0]
        
        axes[0, 2].plot(sample_diff, 'b-', alpha=0.7, linewidth=1)
        axes[0, 2].axhline(y=expected_diff, color='g', linestyle='--', alpha=0.8, label=f'Expected ({expected_diff})')
        if len(missing_samples) > 0:
            axes[0, 2].scatter(missing_samples, sample_diff[missing_samples], 
                              color='red', s=20, alpha=0.8, label=f'Gaps ({len(missing_samples)})')
        axes[0, 2].set_title('Sample Continuity')
        axes[0, 2].set_xlabel('Index')
        axes[0, 2].set_ylabel('Sample Difference')
        axes[0, 2].legend()
        axes[0, 2].grid(True, alpha=0.3)
        
        # Plot 4: Orientation (Roll, Pitch, Yaw)
        axes[1, 0].plot(df['roll'], label='Roll', alpha=0.8)
        axes[1, 0].plot(df['pitch'], label='Pitch', alpha=0.8)
        axes[1, 0].plot(df['yaw'], label='Yaw', alpha=0.8)
        axes[1, 0].set_title('Orientation (Degrees)')
        axes[1, 0].set_xlabel('Sample')
        axes[1, 0].set_ylabel('Degrees')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        
        # Plot 5: Battery voltage and uncertainty
        ax5 = axes[1, 1]
        
        # Plot battery voltage (if available)
        if 'bat_v' in df.columns and not df['bat_v'].isna().all():
            battery_data = df['bat_v'].dropna()
            if len(battery_data) > 0:
                ax5.plot(battery_data.index, battery_data, 'g-', label='Battery (V)', linewidth=2)
                ax5.set_ylabel('Battery Voltage (V)', color='g')
                ax5.tick_params(axis='y', labelcolor='g')
        
        # Plot uncertainty on secondary y-axis
        if 'uncertainty' in df.columns and not df['uncertainty'].isna().all():
            ax5_twin = ax5.twinx()
            uncertainty_data = df['uncertainty'].dropna()
            if len(uncertainty_data) > 0:
                ax5_twin.plot(uncertainty_data.index, uncertainty_data, 'r-', alpha=0.7, label='Uncertainty')
                ax5_twin.set_ylabel('Uncertainty', color='r')
                ax5_twin.tick_params(axis='y', labelcolor='r')
        
        ax5.set_title('Battery & Uncertainty')
        ax5.set_xlabel('Sample')
        ax5.grid(True, alpha=0.3)
        
        # Plot 6: Magnetometer data
        axes[1, 2].plot(df['mag_x'], label='X', alpha=0.7)
        axes[1, 2].plot(df['mag_y'], label='Y', alpha=0.7)
        axes[1, 2].plot(df['mag_z'], label='Z', alpha=0.7)
        axes[1, 2].set_title('Magnetometer (Raw)')
        axes[1, 2].set_xlabel('Sample')
        axes[1, 2].set_ylabel('Raw Value')
        axes[1, 2].legend()
        axes[1, 2].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
        
        # Print some statistics
        print("\n=== Data Statistics ===")
        print(f"Duration: {len(df)} samples")
        print(f"Roll range: {df['roll'].min():.1f}° to {df['roll'].max():.1f}°")
        print(f"Pitch range: {df['pitch'].min():.1f}° to {df['pitch'].max():.1f}°")
        print(f"Yaw range: {df['yaw'].min():.1f}° to {df['yaw'].max():.1f}°")
        
        # Sample continuity analysis
        sample_diff = np.diff(df['sample'])
        missing_count = len(np.where(sample_diff != 1)[0])
        if missing_count > 0:
            print(f"Missing samples: {missing_count} gaps detected")
            total_missing = np.sum(sample_diff[sample_diff > 1] - 1)
            print(f"Total missing samples: {total_missing}")
        else:
            print("Sample continuity: No missing samples detected")
        
        if 'bat_v' in df.columns and not df['bat_v'].isna().all():
            battery_data = df['bat_v'].dropna()
            if len(battery_data) > 0:
                print(f"Battery: {battery_data.min():.2f}V to {battery_data.max():.2f}V")
        
    except Exception as e:
        print(f"Error loading/plotting data: {e}")

if __name__ == "__main__":
    plot_parquet_data()
