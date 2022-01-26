% File for plotting the hysteretic curves (FD curves) and the envelopes as
% read from the corresponding csv-files
% KB, 26.1.2022

clear all
close all
clc

folder_curves='../../Curves/'; % folder in which hysteretic curves are saved (to be read)
folder_new_envelopes='../'; % folder to which envelope curves will be written
folder_database='../../'

plot_figures=0 % 0: Do not plot figures with hystereses and envelopes; 1: Plot figures

%% Read database
filename_database = dir(fullfile(folder_database, '*.xls'))
[~,~,dat]=xlsread(strcat(folder_database,filename_database.name),'Database');
cyclic_vs_monotonic=[dat(2:end,5)];
ID_vec=cell2mat([dat(2:end,1)]);
Reference_vec=[dat(2:end,2)];
Test_unit_vec=[dat(2:end,4)];
FD_curve_available_vec=cell2mat([dat(2:end,66)]);

Ntests=nanmax(ID_vec);

for k=1:Ntests
    % Construct filename
    i1=strfind(Reference_vec{k},' ')-1;
    i2=strfind(Reference_vec{k},'(')+1; i3=strfind(Reference_vec{k},')')-1;
    Test_unit_simplified=erase(erase(erase(erase(erase(Test_unit_vec{k},'.'),'-'),'#'),' '),'_');
    Reference_simplified=strrep(Reference_vec{k}(1:i1),'ç','c');
    Reference_year=Reference_vec{k}(i2:i3)

    FD_filenames{k}=strcat('FD_',Test_unit_simplified,'_',Reference_simplified,Reference_year,'.csv')

end

for k=1:2%Ntests
    if FD_curve_available_vec(k)==1

        %% Read FD curve (hysteretic curve)

        filename=FD_filenames{k};
        filename_with_folder=strcat([folder_curves, filename])

        data=csvread(filename_with_folder,4,0);
        x1=data(:,1); % Displacement
        x2=data(:,3); % Drift
        y=data(:,2); % Force

        env_filename=strrep(filename,'FD','envelope');
        env_filename_with_folder=strcat(folder_new_envelopes,env_filename);
                data=csvread(env_filename_with_folder,4,0);
        x1_env=data(:,1); % Displacement
        x2_env=data(:,3); % Drift
        y_env=data(:,2); % Force

            figure('units','normalized','outerposition',[0 0 0.9 0.9])
            subplot(1,2,1)
            plot(x2,y,'b-'); hold on
            plot(x2_env,y_env,'gx-','linewidth',1.0); hold on
            xlabel('Drift'); ylabel('Force'); title(['Test ', num2str(k),': ',strrep(filename,'_','\_')]);
            subplot(1,2,2)
            plot(x1,y,'b-'); hold on
            plot(x1_env,y_env,'gx-','linewidth',1.0); hold on
            xlabel('Displacement'); ylabel('Force'); title(['Test ', num2str(k),': ',strrep(filename,'_','\_')]);

    end
end
